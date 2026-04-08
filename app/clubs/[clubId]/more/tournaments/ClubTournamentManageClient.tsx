"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubTournamentEditorClient } from "@/app/clubs/[clubId]/more/tournaments/ClubTournamentEditorClient";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import {
  type TournamentApplicationSummary,
  type TournamentDetailResponse,
} from "@/app/lib/clubs";
import {
  getTournamentApprovalBadgeClassName,
  getTournamentApprovalLabel,
  getTournamentStatusBadgeClassName,
  getTournamentStatusLabel,
} from "@/app/lib/tournament";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { getQueryErrorMessage } from "@/app/lib/query-utils";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import {
  cancelTournamentMutationOptions,
  deleteTournamentMutationOptions,
  reviewTournamentApplicationMutationOptions,
  reviewTournamentMutationOptions,
} from "@/app/lib/react-query/tournaments/mutations";
import {
  tournamentDetailQueryOptions,
  tournamentQueryKeys,
} from "@/app/lib/react-query/tournaments/queries";
import { ClubDetailLoadingShell } from "../../ClubRouteLoadingShells";

type ClubTournamentManageClientProps = {
  clubId: string;
  tournamentRecordId: string;
  mode?: "user" | "admin";
  presentation?: "page" | "modal";
  initialSection?: "approval" | "applications" | "review";
  basePath?: string;
  onRequestClose?: () => void;
  onDeleted?: () => void;
};

export function ClubTournamentManageClient({
  clubId,
  tournamentRecordId,
  mode = "user",
  presentation = "page",
  initialSection,
  basePath,
  onRequestClose,
  onDeleted,
}: ClubTournamentManageClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const queryClient = useQueryClient();
  const {
    data: queryPayload,
    isPending: loading,
    refetch,
    error: queryError,
  } = useQuery(tournamentDetailQueryOptions(clubId, tournamentRecordId));
  const [payloadState, setPayload] = useState<TournamentDetailResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelTournament, setShowCancelTournament] = useState(false);
  const [showDeleteTournament, setShowDeleteTournament] = useState(false);
  const [tournamentReviewStatus, setTournamentReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [tournamentRejectionReason, setTournamentRejectionReason] = useState("");
  const reviewApplicationMutation = useMutation(
    reviewTournamentApplicationMutationOptions(clubId, tournamentRecordId),
  );
  const reviewTournamentMutation = useMutation(
    reviewTournamentMutationOptions(clubId, tournamentRecordId),
  );
  const cancelTournamentMutation = useMutation(
    cancelTournamentMutationOptions(clubId, tournamentRecordId),
  );
  const deleteTournamentMutation = useMutation(
    deleteTournamentMutationOptions(clubId, tournamentRecordId),
  );
  const payload = payloadState ?? queryPayload ?? null;
  const error =
    actionError ?? (queryError
      ? getQueryErrorMessage(queryError, "대회 관리 정보를 불러오지 못했습니다.")
      : null);

  const isModal = presentation === "modal";
  const fallbackBasePath = basePath ?? `/clubs/${clubId}/more/tournaments`;

  useEffect(() => {
    if (!payload || !initialSection) {
      return;
    }

    const targetIds =
      initialSection === "review"
        ? ["tournament-review-section", "tournament-approval-section"]
        : initialSection === "applications"
          ? ["tournament-management-section", "tournament-action-section"]
          : ["tournament-approval-section", "tournament-action-section"];

    const frame = window.requestAnimationFrame(() => {
      const target = targetIds
        .map((targetId) => document.getElementById(targetId))
        .find((element) => element !== null);
      if (!target) {
        return;
      }
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [initialSection, payload, reduceMotion]);

  const handleReviewApplication = async (
    application: TournamentApplicationSummary,
    applicationStatus: "APPROVED" | "REJECTED",
  ) => {
    setSaving(true);
    setActionError(null);
    const result = await reviewApplicationMutation.mutateAsync({
      tournamentApplicationId: application.tournamentApplicationId,
      applicationStatus,
    });
    setSaving(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "참가 신청 처리에 실패했습니다.");
      return;
    }
    queryClient.setQueryData(
      tournamentQueryKeys.tournamentDetail(clubId, tournamentRecordId),
      result.data,
    );
    setPayload(result.data);
    void invalidateClubQueries(queryClient, clubId);
  };

  const handleReviewTournament = async () => {
    setSaving(true);
    setActionError(null);
    const result = await reviewTournamentMutation.mutateAsync({
      approvalStatus: tournamentReviewStatus,
      rejectionReason: tournamentReviewStatus === "REJECTED"
        ? tournamentRejectionReason.trim() || null
        : null,
    });
    setSaving(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "대회 승인 검토에 실패했습니다.");
      return;
    }
    queryClient.setQueryData(
      tournamentQueryKeys.tournamentDetail(clubId, tournamentRecordId),
      result.data,
    );
    setPayload(result.data);
    void invalidateClubQueries(queryClient, clubId);
    if (result.data.approvalStatus !== "REJECTED") {
      setTournamentRejectionReason("");
      setTournamentReviewStatus("APPROVED");
    }
  };

  const handleCancelTournament = async () => {
    setSaving(true);
    setActionError(null);
    const result = await cancelTournamentMutation.mutateAsync();
    setSaving(false);
    setShowCancelTournament(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "대회 취소에 실패했습니다.");
      return;
    }
    queryClient.setQueryData(
      tournamentQueryKeys.tournamentDetail(clubId, tournamentRecordId),
      result.data,
    );
    setPayload(result.data);
    void invalidateClubQueries(queryClient, clubId);
  };

  const handleDeleteTournament = async () => {
    setSaving(true);
    setActionError(null);
    const result = await deleteTournamentMutation.mutateAsync(tournamentRecordId);
    setSaving(false);
    setShowDeleteTournament(false);
    if (!result.ok) {
      setActionError(result.message ?? "대회 삭제에 실패했습니다.");
      return;
    }
    void invalidateClubQueries(queryClient, clubId);
    if (onDeleted) {
      onDeleted();
      return;
    }
    window.location.href = fallbackBasePath;
  };

  if (loading && !payload) {
    return <ClubDetailLoadingShell />;
  }

  if (!payload) {
    return (
      <div className="px-4 py-8 text-sm font-medium text-rose-600">
        {error ?? "대회 관리 정보를 찾을 수 없습니다."}
      </div>
    );
  }

  return (
    <div className={isModal ? "flex min-h-0 flex-1 flex-col bg-white font-display text-slate-900" : "min-h-full bg-white font-display text-slate-900"}>
      <div className={isModal ? "flex min-h-0 flex-1 flex-col bg-white" : "mx-auto flex min-h-full max-w-md flex-col bg-white"}>
        <ClubPageHeader
          title="대회 관리"
          subtitle={payload.clubName}
          icon="tune"
          leftSlot={isModal && onRequestClose ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
              aria-label="대회 관리 닫기"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          ) : (
            <RouterLink
              href={fallbackBasePath}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
              aria-label="대회 목록으로 돌아가기"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </RouterLink>
          )}
        />

        <main className={`flex-1 ${isModal ? "overflow-y-auto" : "semo-nav-bottom-space"} px-4 pb-24 pt-5`}>
          {error ? (
            <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          <motion.section
            className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm"
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${getTournamentApprovalBadgeClassName(payload.approvalStatus)}`}>
                    {getTournamentApprovalLabel(payload.approvalStatus)}
                  </span>
                  {payload.approvalStatus === "APPROVED" ? (
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${getTournamentStatusBadgeClassName(payload.tournamentStatus)}`}>
                      {getTournamentStatusLabel(payload.tournamentStatus)}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">{payload.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  작성자 {payload.authorDisplayName} · {payload.tournamentPeriodLabel}
                </p>
              </div>
              <div className="rounded-[20px] bg-slate-100 px-4 py-3 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">신청/승인</p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {payload.applicantCount}/{payload.approvedCount}
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            id="tournament-approval-section"
            className={`mt-6 rounded-[28px] border p-5 shadow-sm ${
              payload.approvalStatus === "REJECTED"
                ? "border-rose-200 bg-rose-50/70"
                : "border-violet-200 bg-violet-50/70"
            }`}
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.04 }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Approval Status</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">승인 상태</h3>
            <p className="mt-3 text-base font-bold text-slate-900">{getTournamentApprovalLabel(payload.approvalStatus)}</p>
            {payload.reviewedAtLabel ? (
              <p className="mt-2 text-sm text-slate-600">
                {payload.reviewedByDisplayName ? `${payload.reviewedByDisplayName} · ` : ""}
                {payload.reviewedAtLabel}
              </p>
            ) : null}
            {payload.rejectionReason ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-rose-700">{payload.rejectionReason}</p>
            ) : payload.approvalStatus === "PENDING" ? (
              <p className="mt-3 text-sm leading-6 text-violet-700">
                관리자 승인 후에만 모임 멤버가 참가 신청할 수 있습니다.
              </p>
            ) : null}
          </motion.section>

          {mode === "admin" && payload.canReviewTournament && payload.approvalStatus !== "APPROVED" ? (
            <motion.section
              id="tournament-review-section"
              className="mt-6 rounded-[28px] border border-amber-200 bg-white p-5 shadow-sm"
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.08 }}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-700">Tournament Review</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">승인 검토</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { value: "APPROVED", label: "승인", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
                  { value: "REJECTED", label: "거절", className: "border-rose-200 bg-rose-50 text-rose-700" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTournamentReviewStatus(option.value as "APPROVED" | "REJECTED")}
                    className={`rounded-[18px] border px-4 py-3 text-sm font-black transition ${
                      tournamentReviewStatus === option.value
                        ? option.className
                        : "border-slate-200 bg-slate-50 text-slate-500"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {tournamentReviewStatus === "REJECTED" ? (
                <textarea
                  value={tournamentRejectionReason}
                  onChange={(event) => setTournamentRejectionReason(event.target.value)}
                  className="mt-4 block min-h-28 w-full rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                  placeholder="거절 사유를 입력하세요."
                />
              ) : null}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleReviewTournament}
                  disabled={saving || (tournamentReviewStatus === "REJECTED" && !tournamentRejectionReason.trim())}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
                >
                  {saving ? "저장 중..." : tournamentReviewStatus === "APPROVED" ? "승인 처리" : "거절 처리"}
                </button>
              </div>
            </motion.section>
          ) : null}

          {mode !== "admin" && payload.canManageApplications ? (
            <motion.section
              id="tournament-management-section"
              className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.12 }}
            >
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Applications</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">참가 신청 관리</h3>
              <div className="mt-4 space-y-3">
                {payload.applications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                    접수된 참가 신청이 없습니다.
                  </div>
                ) : (
                  payload.applications.map((application) => (
                    <div key={application.tournamentApplicationId} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{application.applicantDisplayName}</p>
                          <p className="mt-1 text-xs font-medium text-slate-400">{application.appliedAtLabel}</p>
                          {application.applicationNote ? (
                            <p className="mt-2 text-sm text-slate-600">{application.applicationNote}</p>
                          ) : null}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                          application.applicationStatus === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700"
                            : application.applicationStatus === "REJECTED"
                              ? "bg-rose-50 text-rose-600"
                              : "bg-amber-50 text-amber-700"
                        }`}>
                          {application.applicationStatus}
                        </span>
                      </div>
                      {application.applicationStatus === "APPLIED" ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleReviewApplication(application, "APPROVED")}
                            className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                          >
                            승인
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewApplication(application, "REJECTED")}
                            className="rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white"
                          >
                            반려
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </motion.section>
          ) : null}

          <motion.section
            id="tournament-action-section"
            className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.16 }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Manage Actions</p>
            <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">운영 액션</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {mode !== "admin" && payload.canEdit ? (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="rounded-full border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-black text-sky-700 transition hover:bg-sky-100"
                >
                  대회 수정
                </button>
              ) : null}
              {mode !== "admin" && payload.canCancelTournament ? (
                <button
                  type="button"
                  onClick={() => setShowCancelTournament(true)}
                  className="rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100"
                >
                  조기 취소
                </button>
              ) : null}
              {payload.canDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteTournament(true)}
                  className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-100"
                >
                  대회 삭제
                </button>
              ) : null}
              {!payload.canEdit && !payload.canCancelTournament && !payload.canDelete ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                  현재 사용할 수 있는 운영 액션이 없습니다.
                </div>
              ) : null}
            </div>
          </motion.section>
        </main>

        <AnimatePresence>
          {showEditModal ? (
            <RouteModal onDismiss={() => setShowEditModal(false)} dismissOnBackdrop={false}>
              <ClubTournamentEditorClient
                clubId={clubId}
                tournamentRecordId={tournamentRecordId}
                presentation="modal"
                onRequestClose={() => setShowEditModal(false)}
                onSaved={() => {
                  setShowEditModal(false);
                  void refetch();
                }}
              />
            </RouteModal>
          ) : null}
        </AnimatePresence>

        {showCancelTournament ? (
          <ScheduleActionConfirmModal
            title="대회를 취소할까요?"
            description="취소된 대회는 참가자와 게시판/캘린더 공유 상태는 남지만 신규 신청과 운영 액션은 중단됩니다."
            confirmLabel="대회 취소"
            busyLabel="취소 중..."
            busy={saving}
            onCancel={() => {
              if (!saving) {
                setShowCancelTournament(false);
              }
            }}
            onConfirm={handleCancelTournament}
          />
        ) : null}
        {showDeleteTournament ? (
          <ScheduleActionConfirmModal
            title="대회를 삭제할까요?"
            description="삭제는 관리자 전용 액션이며, 관련 신청 데이터와 공유 상태도 함께 정리됩니다."
            confirmLabel="대회 삭제"
            busyLabel="삭제 중..."
            busy={saving}
            onCancel={() => {
              if (!saving) {
                setShowDeleteTournament(false);
              }
            }}
            onConfirm={handleDeleteTournament}
          />
        ) : null}
      </div>
    </div>
  );
}
