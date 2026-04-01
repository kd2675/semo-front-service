"use client";

import { useState, type CSSProperties } from "react";
import { AnimatePresence } from "motion/react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubBracketDetailModal } from "@/app/components/ClubDetailModals";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouteModal } from "@/app/components/RouteModal";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import {
  createClubBracket,
  deleteClubBracket,
  getClubBracketDetail,
  reviewClubBracket,
  submitClubBracket,
  updateClubBracket,
  type BracketDetailResponse,
  type BracketImportTournament,
  type BracketSummary,
  type ClubAdminBracketHomeResponse,
  type ClubBracketHomeResponse,
  type UpsertBracketRequest,
} from "@/app/lib/clubs";

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

const USER_THEME = {
  "--primary": "#135bec",
  "--background-light": "#f6f6f8",
} as CSSProperties;

const ADMIN_THEME = {
  "--primary": "#ec5b13",
  "--background-light": "#f8f6f6",
} as CSSProperties;

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

function approvalBadgeClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "REJECTED":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function approvalLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return "승인 완료";
    case "PENDING":
      return "승인 대기";
    case "REJECTED":
      return "반려";
    default:
      return "초안";
  }
}

function sourceLabel(sourceType: string) {
  return sourceType === "TOURNAMENT" ? "대회 불러오기" : "직접 작성";
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
  const isAdminMode = mode === "admin";
  const userPayload = !isAdminMode ? (payload as ClubBracketHomeResponse) : null;
  const adminPayload = isAdminMode ? (payload as ClubAdminBracketHomeResponse) : null;
  const [detailBracketId, setDetailBracketId] = useState<string | null>(null);
  const [pendingDeleteBracketId, setPendingDeleteBracketId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBracketId, setEditingBracketId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(createEmptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateParticipants = (
    updater: (participants: EditableParticipant[]) => EditableParticipant[],
  ) => {
    setForm((current) => ({
      ...current,
      participants: updater(current.participants),
    }));
  };

  const fetchDetail = async (bracketRecordId: number) => {
    const result = await getClubBracketDetail(clubId, bracketRecordId);
    if (!result.ok || !result.data) {
      setError(result.message ?? "대진표 상세를 불러오지 못했습니다.");
      return null;
    }
    return result.data;
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
    const result = editingBracketId == null
      ? await createClubBracket(clubId, request)
      : await updateClubBracket(clubId, editingBracketId, request);
    setSubmitting(false);
    if (!result.ok || !result.data) {
      setFormError(result.message ?? "대진표 저장에 실패했습니다.");
      return;
    }
    setFeedback(editingBracketId == null ? "대진표 초안을 만들었습니다." : "대진표 초안을 수정했습니다.");
    setFormOpen(false);
    onReload();
  };

  const handleSubmit = async (bracketRecordId: number) => {
    setSubmitting(true);
    setFeedback(null);
    setError(null);
    const result = await submitClubBracket(clubId, bracketRecordId);
    setSubmitting(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "대진표 제출에 실패했습니다.");
      return;
    }
    setFeedback("대진표를 승인 요청 상태로 제출했습니다.");
    onReload();
  };

  const handleReview = async (bracketRecordId: number, approvalStatus: "APPROVED" | "REJECTED") => {
    const rejectionReason = approvalStatus === "REJECTED"
      ? window.prompt("반려 사유를 입력하세요.", "참가자 구성을 한 번 더 확인해 주세요.") ?? ""
      : null;
    if (approvalStatus === "REJECTED" && !(rejectionReason ?? "").trim()) {
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    setError(null);
    const result = await reviewClubBracket(clubId, bracketRecordId, {
      approvalStatus,
      rejectionReason,
    });
    setSubmitting(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "대진표 검토에 실패했습니다.");
      return;
    }
    setFeedback(approvalStatus === "APPROVED" ? "대진표를 승인했습니다." : "대진표를 반려했습니다.");
    onReload();
  };

  const handleDelete = async (bracketRecordId: number) => {
    setSubmitting(true);
    setFeedback(null);
    setError(null);
    const result = await deleteClubBracket(clubId, bracketRecordId);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "대진표 삭제에 실패했습니다.");
      return;
    }
    if (detailBracketId === String(bracketRecordId)) {
      setDetailBracketId(null);
    }
    setFeedback("대진표를 삭제했습니다.");
    onReload();
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
    <div
      className="min-h-screen text-slate-900 antialiased"
      style={isAdminMode ? ADMIN_THEME : USER_THEME}
    >
      <div className="min-h-screen" style={{ backgroundColor: "var(--background-light)" }}>
        <ClubPageHeader
          title={isAdminMode ? "대진표 승인" : "대진표"}
          subtitle={payload.clubName}
          icon="account_tree"
          theme={isAdminMode ? "admin" : "user"}
          containerClassName="max-w-5xl"
        />

        <main className="semo-nav-bottom-space mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-4 pb-8">
          <section className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
            <article className="rounded-3xl border border-white/70 bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {isAdminMode ? "승인 워크플로우" : "직접 작성 + 대회 불러오기"}
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900">
                  {isAdminMode ? "제출된 대진표를 검토합니다." : "대진표 초안을 만들고 승인 요청합니다."}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  직접 입력한 참가자 명단으로 바로 대진표를 만들 수도 있고, 승인된 대회 참가자를 불러와 수정한 뒤 제출할 수도 있습니다.
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
                      onEdit={() => void openEditForm(bracket)}
                      onSubmit={() => void handleSubmit(bracket.bracketRecordId)}
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
                    onApprove={bracket.approvalStatus === "PENDING"
                      ? () => void handleReview(bracket.bracketRecordId, "APPROVED")
                      : null}
                    onReject={bracket.approvalStatus === "PENDING"
                      ? () => void handleReview(bracket.bracketRecordId, "REJECTED")
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
            className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-transform active:scale-95 ${
              userPayload.admin ? "bottom-40" : "bottom-24"
            }`}
            style={{ boxShadow: "0 8px 20px rgba(19, 91, 236, 0.28)" }}
          >
            <span className="material-symbols-outlined text-[28px]">account_tree</span>
          </button>
        ) : null}

        {!isAdminMode && userPayload?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}

        <AnimatePresence>
          {formOpen ? (
            <RouteModal
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
                    className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
                    aria-label="닫기"
                  >
                    <span className="material-symbols-outlined">close</span>
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
                      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                        {(["DIRECT", "TOURNAMENT"] as const).map((sourceType) => {
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
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">참가자</h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {isTournamentImportMode
                            ? "대회 불러오기 모드에서는 승인된 대회 참가자만 사용할 수 있습니다. 이름과 순서는 제출 전까지 조정할 수 있습니다."
                            : "순서가 그대로 시드 순서가 됩니다. 불러온 참가자도 제출 전까지 이름을 수정할 수 있습니다."}
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
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
                                <p className="text-sm font-semibold text-slate-900">Seed {index + 1}</p>
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
                          <span className="material-symbols-outlined text-[20px]">add_circle</span>
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
              onConfirm={() =>
                void handleDelete(pendingDeleteBracketId).finally(() => {
                  setPendingDeleteBracketId(null);
                })
              }
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function BracketCard({
  bracket,
  onOpen,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onDelete,
}: {
  bracket: BracketSummary;
  onOpen: () => void;
  onEdit: (() => void) | null;
  onSubmit: (() => void) | null;
  onApprove: (() => void) | null;
  onReject: (() => void) | null;
  onDelete: (() => void) | null;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${approvalBadgeClass(bracket.approvalStatus)}`}>
              {approvalLabel(bracket.approvalStatus)}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {sourceLabel(bracket.sourceType)}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              {bracket.participantCount}명
            </span>
          </div>
          <h4 className="mt-3 text-lg font-bold text-slate-900">{bracket.title}</h4>
          {bracket.summaryText ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{bracket.summaryText}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
            {bracket.sourceTournamentTitle ? <span>원본 대회: {bracket.sourceTournamentTitle}</span> : null}
            {bracket.authorDisplayName ? <span>작성자: {bracket.authorDisplayName}</span> : null}
            {bracket.reviewedAtLabel ? <span>검토: {bracket.reviewedAtLabel}</span> : null}
          </div>
          {bracket.rejectionReason ? (
            <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              반려 사유: {bracket.rejectionReason}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
        >
          상세
        </button>
      </div>
      {(onEdit || onSubmit || onApprove || onReject || onDelete) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {onEdit ? (
            <button type="button" onClick={onEdit} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
              수정
            </button>
          ) : null}
          {onSubmit ? (
            <button type="button" onClick={onSubmit} className="rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white">
              제출
            </button>
          ) : null}
          {onApprove ? (
            <button type="button" onClick={onApprove} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
              승인
            </button>
          ) : null}
          {onReject ? (
            <button type="button" onClick={onReject} className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white">
              반려
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" onClick={onDelete} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              삭제
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
