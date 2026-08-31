"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubBracketDetailModal } from "@/app/components/ClubDetailModals";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouteModal } from "@/app/components/RouteModal";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/modals/ScheduleActionConfirmModal";
import {
  type BracketDetailResponse,
  type BracketImportTournament,
  type BracketSummary,
  type ClubAdminBracketHomeResponse,
  type ClubBracketHomeResponse,
  type UpsertBracketRequest,
} from "@/app/lib/clubs";
import { FAB_RIGHT_OFFSET_CLASS_NAME, getActionFabBottomClass } from "@/app/lib/fab";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import { bracketDetailQueryOptions } from "@/app/lib/react-query/brackets/queries";
import {
  deleteBracketMutationOptions,
  reviewBracketMutationOptions,
  saveBracketDraftMutationOptions,
  submitBracketMutationOptions,
} from "@/app/lib/react-query/brackets/mutations";
import { BracketRejectModal } from "./BracketRejectModal";
import { BracketCard, EmptyState } from "./BracketCard";
import { sourceLabel } from "./bracketPresentation";

type ClubBracketHomeClientProps = {
  clubId: string;
  payload: ClubBracketHomeResponse | ClubAdminBracketHomeResponse;
  mode?: "user" | "admin";
  onReload: () => void;
};

type EditableParticipant = {
  displayName: string;
  clubProfileId: number | null;
  sourceTournamentApplicationId: number | null;
};

type FormState = {
  title: string;
  summaryText: string;
  sourceType: "DIRECT" | "TOURNAMENT";
  sourceTournamentRecordId: string;
  participants: EditableParticipant[];
};

function createEmptyParticipants(count = 4): EditableParticipant[] {
  return Array.from({ length: count }, () => ({
    displayName: "",
    clubProfileId: null,
    sourceTournamentApplicationId: null,
  }));
}

function createEmptyForm(): FormState {
  return {
    title: "",
    summaryText: "",
    sourceType: "DIRECT",
    sourceTournamentRecordId: "",
    participants: createEmptyParticipants(),
  };
}

function toFormFromDetail(detail: BracketDetailResponse): FormState {
  return {
    title: detail.title,
    summaryText: detail.summaryText ?? "",
    sourceType: (detail.sourceType as "DIRECT" | "TOURNAMENT") ?? "DIRECT",
    sourceTournamentRecordId: detail.sourceTournamentRecordId ? String(detail.sourceTournamentRecordId) : "",
    participants: detail.participants.map((participant) => ({
      displayName: participant.displayName,
      clubProfileId: participant.clubProfileId ?? null,
      sourceTournamentApplicationId: participant.sourceTournamentApplicationId ?? null,
    })),
  };
}

function toRequest(form: FormState): UpsertBracketRequest {
  return {
    title: form.title.trim(),
    summaryText: form.summaryText.trim() || null,
    bracketType: "SINGLE_ELIMINATION",
    participantType: form.sourceType === "TOURNAMENT" ? "MEMBER" : "MIXED",
    sourceType: form.sourceType,
    sourceTournamentRecordId: form.sourceType === "TOURNAMENT" && form.sourceTournamentRecordId
      ? Number(form.sourceTournamentRecordId)
      : null,
    participants: form.participants
      .map((participant, index) => ({
        displayName: participant.displayName.trim(),
        clubProfileId: form.sourceType === "TOURNAMENT" ? participant.clubProfileId : null,
        seedNumber: index + 1,
        sourceTournamentApplicationId: participant.sourceTournamentApplicationId,
      }))
      .filter((participant) => participant.displayName),
  };
}

function validateBracketForm(form: FormState) {
  const title = form.title.trim();
  if (!title) {
    return "대진표 제목을 입력해 주세요.";
  }
  if (title.length > 200) {
    return "대진표 제목은 200자 이하로 입력해 주세요.";
  }

  const summaryText = form.summaryText.trim();
  if (summaryText.length > 500) {
    return "대진표 설명은 500자 이하로 입력해 주세요.";
  }

  if (form.sourceType === "TOURNAMENT" && !form.sourceTournamentRecordId) {
    return "불러올 대회를 선택해 주세요.";
  }

  const normalizedParticipants = form.participants.map((participant) => ({
    ...participant,
    displayName: participant.displayName.trim(),
  }));

  if (form.sourceType === "TOURNAMENT") {
    if (normalizedParticipants.length < 2) {
      return "대회 참가자가 2명 이상 필요합니다.";
    }
    const invalidTournamentParticipant = normalizedParticipants.find((participant) =>
      !participant.sourceTournamentApplicationId || !participant.clubProfileId || !participant.displayName,
    );
    if (invalidTournamentParticipant) {
      return "대회 불러오기에서는 승인된 대회 참가자만 사용할 수 있습니다.";
    }
    if (normalizedParticipants.some((participant) => participant.displayName.length > 100)) {
      return "참가자 이름은 100자 이하로 입력해 주세요.";
    }
    return null;
  }

  const namedParticipants = normalizedParticipants.filter((participant) => participant.displayName);
  if (namedParticipants.length < 2) {
    return "참가자 이름을 2명 이상 입력해 주세요.";
  }
  if (namedParticipants.some((participant) => participant.displayName.length > 100)) {
    return "참가자 이름은 100자 이하로 입력해 주세요.";
  }
  return null;
}

export function ClubBracketHomeClient({
  clubId,
  payload,
  mode = "user",
  onReload,
}: ClubBracketHomeClientProps) {
  const queryClient = useQueryClient();
  const isAdminMode = mode === "admin";
  const userPayload = !isAdminMode ? (payload as ClubBracketHomeResponse) : null;
  const adminPayload = isAdminMode ? (payload as ClubAdminBracketHomeResponse) : null;
  const hasModeSwitchFab = !isAdminMode && Boolean(userPayload?.admin);
  const [detailBracketId, setDetailBracketId] = useState<string | null>(null);
  const [pendingDeleteBracketId, setPendingDeleteBracketId] = useState<number | null>(null);
  const [pendingRejectBracketId, setPendingRejectBracketId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBracketId, setEditingBracketId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(createEmptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const saveBracketMutation = useMutation(saveBracketDraftMutationOptions(clubId));
  const submitBracketMutation = useMutation(submitBracketMutationOptions(clubId));
  const reviewBracketMutation = useMutation(reviewBracketMutationOptions(clubId));
  const deleteBracketMutation = useMutation(deleteBracketMutationOptions(clubId));

  const updateParticipants = (
    updater: (participants: EditableParticipant[]) => EditableParticipant[],
  ) => {
    setForm((current) => ({
      ...current,
      participants: updater(current.participants),
    }));
  };

  const fetchDetail = async (bracketRecordId: number) => {
    try {
      return await queryClient.fetchQuery(bracketDetailQueryOptions(clubId, bracketRecordId));
    } catch {
      setError("대진표 상세를 불러오지 못했습니다.");
      return null;
    }
  };

  const openCreateForm = () => {
    setEditingBracketId(null);
    setForm(createEmptyForm());
    setFormError(null);
    setFeedback(null);
    setError(null);
    setFormOpen(true);
  };

  const openEditForm = async (summary: BracketSummary) => {
    const detail = await fetchDetail(summary.bracketRecordId);
    if (!detail) {
      return;
    }
    setEditingBracketId(summary.bracketRecordId);
    setForm(toFormFromDetail(detail));
    setFormError(null);
    setFeedback(null);
    setError(null);
    setFormOpen(true);
  };

  const applyImportedTournament = (tournament: BracketImportTournament) => {
    setForm((current) => ({
      ...current,
      sourceType: "TOURNAMENT",
      sourceTournamentRecordId: String(tournament.tournamentRecordId),
      participants: tournament.participants.map((participant) => ({
        displayName: participant.displayName,
        clubProfileId: participant.clubProfileId ?? null,
        sourceTournamentApplicationId: participant.tournamentApplicationId,
      })),
    }));
  };

  const handleSourceTypeChange = (nextSourceType: FormState["sourceType"]) => {
    setForm((current) => ({
      ...current,
      sourceType: nextSourceType,
      sourceTournamentRecordId: nextSourceType === "TOURNAMENT" ? current.sourceTournamentRecordId : "",
      participants: nextSourceType === "TOURNAMENT"
        ? current.participants
        : current.participants.map((participant) => ({
            ...participant,
            sourceTournamentApplicationId: null,
          })),
    }));
  };

  const handleSave = async () => {
    setFormError(null);
    setFeedback(null);
    setError(null);
    const validationMessage = validateBracketForm(form);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    setSubmitting(true);
    const request = toRequest(form);
    const result = await saveBracketMutation.mutateAsync({
      request,
      editingBracketId,
    });
    setSubmitting(false);
    if (!result.ok || !result.data) {
      setFormError(result.message ?? "대진표 저장에 실패했습니다.");
      return;
    }
    setFeedback(editingBracketId == null ? "대진표 초안을 만들었습니다." : "대진표 초안을 수정했습니다.");
    setFormOpen(false);
    void invalidateClubQueries(queryClient, clubId);
    onReload();
  };

  const handleSubmit = async (bracketRecordId: number) => {
    setSubmitting(true);
    setFeedback(null);
    setError(null);
    const result = await submitBracketMutation.mutateAsync(bracketRecordId);
    setSubmitting(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "대진표 제출에 실패했습니다.");
      return;
    }
    setFeedback("대진표를 승인 요청 상태로 제출했습니다.");
    void invalidateClubQueries(queryClient, clubId);
    onReload();
  };

  const handleReview = async (
    bracketRecordId: number,
    approvalStatus: "APPROVED" | "REJECTED",
    reason: string | null = null,
  ): Promise<boolean> => {
    setSubmitting(true);
    setFeedback(null);
    setError(null);
    const result = await reviewBracketMutation.mutateAsync({
      bracketRecordId,
      approvalStatus,
      rejectionReason: reason,
    });
    setSubmitting(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "대진표 검토에 실패했습니다.");
      return false;
    }
    setFeedback(approvalStatus === "APPROVED" ? "대진표를 승인했습니다." : "대진표를 반려했습니다.");
    void invalidateClubQueries(queryClient, clubId);
    onReload();
    return true;
  };

  const handleDelete = async (bracketRecordId: number): Promise<boolean> => {
    setSubmitting(true);
    setFeedback(null);
    setError(null);
    const result = await deleteBracketMutation.mutateAsync(bracketRecordId);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "대진표 삭제에 실패했습니다.");
      return false;
    }
    if (detailBracketId === String(bracketRecordId)) {
      setDetailBracketId(null);
    }
    setFeedback("대진표를 삭제했습니다.");
    void invalidateClubQueries(queryClient, clubId);
    onReload();
    return true;
  };

  const list = isAdminMode
    ? adminPayload?.brackets ?? []
    : userPayload?.publishedBrackets ?? [];
  const myBrackets = userPayload?.myBrackets ?? [];
  const isTournamentImportMode = form.sourceType === "TOURNAMENT";
  const formSubmitLabel = submitting
    ? "저장 중..."
    : editingBracketId == null
      ? "초안 만들기"
      : "초안 저장";

  return (
    <div className="min-h-screen text-slate-900 antialiased">
      <div className="min-h-screen" style={{ backgroundColor: "var(--background-light)" }}>
        <ClubPageHeader
          title={isAdminMode ? "대진표 초안 검토" : "대진표 초안"}
          subtitle={payload.clubName}
          icon="account_tree"
          theme={isAdminMode ? "admin" : "user"}
          containerClassName="semo-page-data"
        />

        <main className="semo-page-data semo-nav-bottom-space flex flex-col gap-4 px-4 pt-4 pb-8">
          <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <article className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {isAdminMode
                    ? adminPayload?.canReview ? "승인 워크플로우" : "대진표 운영"
                    : userPayload?.tournamentIntegrationEnabled ? "직접 작성 + 대회 불러오기" : "직접 작성"}
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">
                  {isAdminMode
                    ? adminPayload?.canReview
                      ? "제출된 대진표를 검토합니다."
                      : "대진표 상태와 삭제 가능한 항목을 관리합니다."
                    : "대진표 초안을 만들고 승인 요청합니다."}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  {userPayload?.tournamentIntegrationEnabled
                    ? "직접 입력한 참가자 명단으로 만들거나 승인된 대회 참가자를 불러와 제출할 수 있습니다."
                    : "다른 기능 없이 참가자 이름을 직접 입력해 대진표를 만들고 검토받을 수 있습니다."}
                </p>
              </div>
            </article>

            <article className="grid gap-3 rounded-3xl border border-white/70 bg-white p-5 shadow-sm md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  승인 완료
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {isAdminMode ? adminPayload?.approvedBracketCount ?? 0 : userPayload?.approvedBracketCount ?? 0}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  승인 대기
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {isAdminMode ? adminPayload?.pendingBracketCount ?? 0 : userPayload?.pendingBracketCount ?? 0}
                </p>
              </div>
              {isAdminMode ? (
                <>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      초안
                    </p>
                    <p className="mt-2 text-2xl font-bold">{adminPayload?.draftBracketCount ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      반려
                    </p>
                    <p className="mt-2 text-2xl font-bold">{adminPayload?.rejectedBracketCount ?? 0}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      내 작업
                    </p>
                    <p className="mt-2 text-2xl font-bold">{myBrackets.length}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      시작 방식
                    </p>
                    <p className="mt-2 text-base font-bold">직접 작성 / 대회 불러오기</p>
                  </div>
                </>
              )}
            </article>
          </section>

          {feedback ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {feedback}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {!isAdminMode ? (
            <section className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
              <section className="rounded-3xl border border-white/70 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">내 대진표</h3>
                  <span className="text-sm text-slate-400">{myBrackets.length}개</span>
                </div>
                <div className="mt-4 space-y-3">
                  {myBrackets.length ? myBrackets.map((bracket) => (
                    <BracketCard
                      key={bracket.bracketRecordId}
                      bracket={bracket}
                      onOpen={() => setDetailBracketId(String(bracket.bracketRecordId))}
                      onEdit={bracket.canEdit ? () => void openEditForm(bracket) : null}
                      onSubmit={bracket.canSubmit ? () => void handleSubmit(bracket.bracketRecordId) : null}
                      onApprove={null}
                      onReject={null}
                      onDelete={bracket.canDelete ? () => setPendingDeleteBracketId(bracket.bracketRecordId) : null}
                    />
                  )) : (
                    <EmptyState
                      title="아직 만든 대진표가 없습니다."
                      description="직접 작성하거나 승인된 대회 참가자를 불러와 첫 초안을 만들어 보세요."
                    />
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-white/70 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">공개 대진표</h3>
                  <span className="text-sm text-slate-400">{list.length}개</span>
                </div>
                <div className="mt-4 space-y-3">
                  {list.length ? list.map((bracket) => (
                    <BracketCard
                      key={bracket.bracketRecordId}
                      bracket={bracket}
                      onOpen={() => setDetailBracketId(String(bracket.bracketRecordId))}
                      onEdit={null}
                      onSubmit={null}
                      onApprove={null}
                      onReject={null}
                      onDelete={null}
                    />
                  )) : (
                    <EmptyState
                      title="아직 승인된 대진표가 없습니다."
                      description="첫 대진표가 승인되면 이 영역에 공개됩니다."
                    />
                  )}
                </div>
              </section>
            </section>
          ) : (
            <section className="rounded-3xl border border-white/70 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">검토 대상</h3>
                <span className="text-sm text-slate-400">{list.length}개</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {list.length ? list.map((bracket) => (
                  <BracketCard
                    key={bracket.bracketRecordId}
                    bracket={bracket}
                    onOpen={() => setDetailBracketId(String(bracket.bracketRecordId))}
                    onEdit={null}
                    onSubmit={null}
                    onApprove={adminPayload?.canReview && bracket.approvalStatus === "PENDING"
                      ? () => void handleReview(bracket.bracketRecordId, "APPROVED")
                      : null}
                    onReject={adminPayload?.canReview && bracket.approvalStatus === "PENDING"
                      ? () => {
                          setPendingRejectBracketId(bracket.bracketRecordId);
                          setRejectionReason("");
                        }
                      : null}
                    onDelete={bracket.canDelete ? () => setPendingDeleteBracketId(bracket.bracketRecordId) : null}
                  />
                )) : (
                  <EmptyState
                    title="검토할 대진표가 없습니다."
                    description="유저가 제출한 대진표가 들어오면 여기서 승인 또는 반려할 수 있습니다."
                  />
                )}
              </div>
            </section>
          )}
        </main>

        {!isAdminMode && userPayload?.canCreate ? (
          <button
            type="button"
            aria-label="대진표 작성"
            onClick={openCreateForm}
            className={`fixed ${FAB_RIGHT_OFFSET_CLASS_NAME} ${getActionFabBottomClass(hasModeSwitchFab)} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-transform active:scale-95`}
            style={{ boxShadow: "0 8px 20px rgba(19, 91, 236, 0.28)" }}
          >
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">account_tree</span>
          </button>
        ) : null}

        {hasModeSwitchFab ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}

        <AnimatePresence>
          {formOpen ? (
            <RouteModal
              ariaLabel={editingBracketId == null ? "대진표 작성" : "대진표 수정"}
              onDismiss={() => setFormOpen(false)}
              dismissOnBackdrop={false}
              contentClassName="max-w-3xl"
            >
              <div className="flex min-h-0 flex-1 flex-col bg-white">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {editingBracketId == null ? "새 초안" : "초안 수정"}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-900">대진표 작성</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      생성 방식과 참가자 구성을 정리한 뒤 저장하세요.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="semo-icon-control rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                    aria-label="닫기"
                  >
                    <span className="material-symbols-outlined" aria-hidden="true">close</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 pb-8 sm:px-6">
                  {formError ? (
                    <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {formError}
                    </div>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-semibold text-slate-700">제목</span>
                      <input
                        value={form.title}
                        onChange={(event) => {
                          setForm((current) => ({ ...current, title: event.target.value }));
                          if (formError) {
                            setFormError(null);
                          }
                        }}
                        maxLength={200}
                        className={`w-full rounded-2xl px-4 py-3 text-sm outline-none transition ${
                          formError?.includes("제목")
                            ? "border border-rose-300 bg-rose-50/40 focus:border-rose-400"
                            : "border border-slate-200 focus:border-[var(--primary)]"
                        }`}
                        placeholder="예: 봄 시즌 친선전 대진표"
                      />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-semibold text-slate-700">설명</span>
                      <textarea
                        value={form.summaryText}
                        onChange={(event) => setForm((current) => ({ ...current, summaryText: event.target.value }))}
                        rows={3}
                        maxLength={500}
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                        placeholder="대진표 목적이나 운영 메모를 남겨 두세요."
                      />
                    </label>
                    <div className="space-y-2 md:col-span-2">
                      <span className="text-sm font-semibold text-slate-700">생성 방식</span>
                      <div className={`grid gap-2 rounded-2xl bg-slate-100 p-1 ${userPayload?.tournamentIntegrationEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
                        {(["DIRECT", ...(userPayload?.tournamentIntegrationEnabled ? ["TOURNAMENT" as const] : [])] as const).map((sourceType) => {
                          const active = form.sourceType === sourceType;
                          return (
                            <button
                              key={sourceType}
                              type="button"
                              onClick={() => handleSourceTypeChange(sourceType)}
                              className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${
                                active
                                  ? "bg-white text-slate-900 shadow-sm"
                                  : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              {sourceLabel(sourceType)}
                            </button>
                          );
                        })}
                      </div>
                      {!userPayload?.tournamentIntegrationEnabled ? (
                        <p className="text-xs leading-5 text-slate-500">대회 기능을 함께 켜면 승인된 참가자를 불러올 수 있습니다.</p>
                      ) : null}
                    </div>
                    {form.sourceType === "TOURNAMENT" ? (
                      <div className="space-y-3 md:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-slate-700">불러올 대회</span>
                          <span className="text-xs text-slate-400">
                            {userPayload?.importableTournaments.length ?? 0}개
                          </span>
                        </div>
                        {userPayload?.importableTournaments.length ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            {userPayload.importableTournaments.map((tournament) => {
                              const selected = form.sourceTournamentRecordId === String(tournament.tournamentRecordId);
                              return (
                                <button
                                  key={tournament.tournamentRecordId}
                                  type="button"
                                  onClick={() => applyImportedTournament(tournament)}
                                  className={`rounded-2xl border p-4 text-left transition ${
                                    selected
                                      ? "border-[var(--primary)] bg-blue-50"
                                      : "border-slate-200 bg-slate-50 hover:border-[var(--primary)]/30"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-slate-900">{tournament.title}</p>
                                      <p className="mt-1 text-xs text-slate-500">
                                        {tournament.tournamentPeriodLabel ?? "일정 미정"}
                                      </p>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                      {tournament.participantCount}명
                                    </span>
                                  </div>
                                  {tournament.summaryText ? (
                                    <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                                      {tournament.summaryText}
                                    </p>
                                  ) : null}
                                  <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-400">
                                      {selected ? "현재 불러온 대회" : "선택하면 참가자를 채웁니다"}
                                    </span>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                                      불러오기
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                            불러올 수 있는 승인 대회가 없습니다.
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-slate-900">참가자</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {isTournamentImportMode
                            ? "대회 불러오기 모드에서는 승인된 대회 참가자만 사용할 수 있습니다. 이름과 순서는 제출 전까지 조정할 수 있습니다."
                            : "순서가 그대로 시드 순서가 됩니다. 불러온 참가자도 제출 전까지 이름을 수정할 수 있습니다."}
                        </p>
                      </div>
                      <div className="shrink-0 whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                        {form.participants.length}명
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {form.participants.map((participant, index) => (
                        <div
                          key={`${participant.sourceTournamentApplicationId ?? "manual"}-${index}`}
                          className="rounded-[22px] border border-slate-200 bg-white p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-700">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">시드 {index + 1}</p>
                                <p className="text-xs text-slate-400">
                                  {participant.sourceTournamentApplicationId ? "대회 불러오기 참가자" : "직접 편집 참가자"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => updateParticipants((currentParticipants) => {
                                  const nextParticipants = [...currentParticipants];
                                  [nextParticipants[index - 1], nextParticipants[index]] = [nextParticipants[index], nextParticipants[index - 1]];
                                  return nextParticipants;
                                })}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
                              >
                                위로
                              </button>
                              <button
                                type="button"
                                disabled={index === form.participants.length - 1}
                                onClick={() => updateParticipants((currentParticipants) => {
                                  const nextParticipants = [...currentParticipants];
                                  [nextParticipants[index], nextParticipants[index + 1]] = [nextParticipants[index + 1], nextParticipants[index]];
                                  return nextParticipants;
                                })}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-40"
                              >
                                아래로
                              </button>
                              <button
                                type="button"
                                disabled={form.participants.length <= 2}
                                onClick={() => updateParticipants((currentParticipants) =>
                                  currentParticipants.filter((_, itemIndex) => itemIndex !== index),
                                )}
                                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 disabled:opacity-40"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                          <input
                            aria-label={`${index + 1}번 참가자 이름`}
                            value={participant.displayName}
                            onChange={(event) => {
                              const nextValue = event.target.value;
                              updateParticipants((currentParticipants) =>
                                currentParticipants.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, displayName: nextValue } : item,
                                ),
                              );
                            }}
                            maxLength={100}
                            className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)]"
                            placeholder="참가자 이름"
                          />
                        </div>
                      ))}
                      {isTournamentImportMode ? (
                        <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-100 px-4 py-4 text-center text-sm font-medium text-slate-500">
                          대회 불러오기에서는 수동 참가자 추가를 지원하지 않습니다.
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateParticipants((currentParticipants) => ([
                            ...currentParticipants,
                            { displayName: "", clubProfileId: null, sourceTournamentApplicationId: null },
                          ]))}
                          className="flex w-full items-center justify-center gap-2 rounded-[22px] border border-dashed border-[var(--primary)]/35 bg-white px-4 py-4 text-sm font-semibold text-[var(--primary)] transition hover:bg-blue-50"
                        >
                          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">add_circle</span>
                          참가자 추가
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-200 bg-white/95 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur sm:px-6">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setFormOpen(false)}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleSave()}
                      className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                    >
                      {formSubmitLabel}
                    </button>
                  </div>
                </div>
              </div>
            </RouteModal>
          ) : null}

        {detailBracketId ? (
          <ClubBracketDetailModal
            clubId={clubId}
              bracketRecordId={detailBracketId}
              mode={mode}
              onRequestClose={() => setDetailBracketId(null)}
              onReload={onReload}
            />
          ) : null}
          {pendingDeleteBracketId != null ? (
            <ScheduleActionConfirmModal
              title="대진표 삭제"
              description="이 대진표를 삭제할까요?"
              confirmLabel="대진표 삭제"
              busyLabel="삭제 중..."
              busy={submitting}
              onCancel={() => {
                if (!submitting) {
                  setPendingDeleteBracketId(null);
                }
              }}
              onConfirm={() => {
                void handleDelete(pendingDeleteBracketId).then((succeeded) => {
                  if (succeeded) {
                    setPendingDeleteBracketId(null);
                  }
                });
              }}
            />
          ) : null}
          {pendingRejectBracketId != null ? (
            <BracketRejectModal
              reason={rejectionReason}
              busy={submitting}
              onReasonChange={setRejectionReason}
              onCancel={() => {
                if (!submitting) {
                  setPendingRejectBracketId(null);
                  setRejectionReason("");
                }
              }}
              onConfirm={() => {
                const bracketRecordId = pendingRejectBracketId;
                void handleReview(bracketRecordId, "REJECTED", rejectionReason.trim()).then((succeeded) => {
                  if (succeeded) {
                    setPendingRejectBracketId(null);
                    setRejectionReason("");
                  }
                });
              }}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
