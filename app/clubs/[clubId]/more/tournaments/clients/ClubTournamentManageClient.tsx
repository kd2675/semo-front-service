"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubTournamentEditorClient } from "@/app/clubs/[clubId]/more/tournaments/clients/ClubTournamentEditorClient";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/modals/ScheduleActionConfirmModal";
import {
  type TournamentApplicationSummary,
  type TournamentDetailResponse,
  type TournamentScheduleSlot,
} from "@/app/lib/clubs";
import {
  getTournamentApprovalBadgeClassName,
  getTournamentApprovalLabel,
  getTournamentStatusBadgeClassName,
  getTournamentStatusLabel,
} from "@/app/lib/tournament";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import {
  cancelTournamentMutationOptions,
  deleteTournamentScheduleSlotMutationOptions,
  deleteTournamentMutationOptions,
  reviewTournamentApplicationMutationOptions,
  reviewTournamentMutationOptions,
  saveTournamentScheduleSlotMutationOptions,
  updateTournamentApplicationOperationsMutationOptions,
} from "@/app/lib/react-query/tournaments/mutations";
import {
  tournamentDetailQueryOptions,
  tournamentQueryKeys,
} from "@/app/lib/react-query/tournaments/queries";
import { ClubDetailLoadingShell } from "../../../ClubRouteLoadingShells";

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
  const router = useRouter();
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
  const [cancelReason, setCancelReason] = useState("");
  const [showDeleteTournament, setShowDeleteTournament] = useState(false);
  const [tournamentReviewStatus, setTournamentReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [tournamentRejectionReason, setTournamentRejectionReason] = useState("");
  const [editingScheduleSlotId, setEditingScheduleSlotId] = useState<number | null>(null);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleCourtLabel, setScheduleCourtLabel] = useState("");
  const [scheduleStartAt, setScheduleStartAt] = useState("");
  const [scheduleEndAt, setScheduleEndAt] = useState("");
  const [scheduleNote, setScheduleNote] = useState("");
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
  const saveScheduleSlotMutation = useMutation(
    saveTournamentScheduleSlotMutationOptions(clubId, tournamentRecordId),
  );
  const deleteScheduleSlotMutation = useMutation(
    deleteTournamentScheduleSlotMutationOptions(clubId, tournamentRecordId),
  );
  const updateApplicationOperationsMutation = useMutation(
    updateTournamentApplicationOperationsMutationOptions(clubId, tournamentRecordId),
  );
  const payload = payloadState ?? queryPayload ?? null;
  const error =
    actionError ?? (queryError
      ? getQueryErrorMessage(queryError, "대회 관리 정보를 불러오지 못했습니다.")
      : null);

  const isModal = presentation === "modal";
  const fallbackBasePath = basePath ?? `/clubs/${clubId}/more/tournaments`;

  const applyMutationResult = (nextPayload: TournamentDetailResponse) => {
    queryClient.setQueryData(
      tournamentQueryKeys.tournamentDetail(clubId, tournamentRecordId),
      nextPayload,
    );
    setPayload(nextPayload);
    void invalidateClubQueries(queryClient, clubId);
  };

  const resetScheduleForm = () => {
    setEditingScheduleSlotId(null);
    setScheduleTitle("");
    setScheduleCourtLabel("");
    setScheduleStartAt("");
    setScheduleEndAt("");
    setScheduleNote("");
  };

  const startEditingScheduleSlot = (slot: TournamentScheduleSlot) => {
    setEditingScheduleSlotId(slot.tournamentScheduleSlotId);
    setScheduleTitle(slot.title);
    setScheduleCourtLabel(slot.courtLabel ?? "");
    setScheduleStartAt(slot.startAt.slice(0, 16));
    setScheduleEndAt(slot.endAt.slice(0, 16));
    setScheduleNote(slot.note ?? "");
  };

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

  const handleSaveScheduleSlot = async () => {
    if (!scheduleTitle.trim() || !scheduleStartAt || !scheduleEndAt) {
      setActionError("일정 제목과 시작·종료 시각을 모두 입력하세요.");
      return;
    }
    setSaving(true);
    setActionError(null);
    const result = await saveScheduleSlotMutation.mutateAsync({
      scheduleSlotId: editingScheduleSlotId,
      request: {
        title: scheduleTitle.trim(),
        courtLabel: scheduleCourtLabel.trim() || null,
        startAt: scheduleStartAt,
        endAt: scheduleEndAt,
        note: scheduleNote.trim() || null,
      },
    });
    setSaving(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "대회 일정을 저장하지 못했습니다.");
      return;
    }
    applyMutationResult(result.data);
    resetScheduleForm();
  };

  const handleDeleteScheduleSlot = async (scheduleSlotId: number) => {
    setSaving(true);
    setActionError(null);
    const result = await deleteScheduleSlotMutation.mutateAsync(scheduleSlotId);
    setSaving(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "대회 일정을 삭제하지 못했습니다.");
      return;
    }
    applyMutationResult(result.data);
    if (editingScheduleSlotId === scheduleSlotId) {
      resetScheduleForm();
    }
  };

  const handleUpdateApplicationOperations = async (
    application: TournamentApplicationSummary,
    request: { checkedIn: boolean; placement: number | null; resultNote: string | null },
  ) => {
    setSaving(true);
    setActionError(null);
    const result = await updateApplicationOperationsMutation.mutateAsync({
      tournamentApplicationId: application.tournamentApplicationId,
      request,
    });
    setSaving(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "참가자 체크인·결과를 저장하지 못했습니다.");
      return false;
    }
    applyMutationResult(result.data);
    return true;
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
    const normalizedReason = cancelReason.trim();
    if (!normalizedReason) {
      setActionError("대회 취소 사유를 입력해 주세요.");
      return;
    }
    setSaving(true);
    setActionError(null);
    const result = await cancelTournamentMutation.mutateAsync(normalizedReason);
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
    setCancelReason("");
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
    router.replace(fallbackBasePath);
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
          layout={isModal ? "modal" : "page"}
          leftSlot={!isModal ? (
            <RouterLink
              href={fallbackBasePath}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
              aria-label="대회 목록으로 돌아가기"
            >
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">arrow_back</span>
            </RouterLink>
          ) : undefined}
          rightSlot={isModal && onRequestClose ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="semo-icon-control transition-colors hover:bg-slate-100"
              aria-label="대회 관리 닫기"
            >
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">close</span>
            </button>
          ) : undefined}
        />

        <main className={`flex-1 ${isModal ? "overflow-y-auto" : "semo-nav-bottom-space"} px-4 pb-24 pt-5`}>
          {error ? (
            <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          <motion.section
            className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-6 shadow-sm"
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${getTournamentApprovalBadgeClassName(payload.approvalStatus)}`}>
                    {getTournamentApprovalLabel(payload.approvalStatus)}
                  </span>
                  {payload.approvalStatus === "APPROVED" ? (
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${getTournamentStatusBadgeClassName(payload.tournamentStatus)}`}>
                      {getTournamentStatusLabel(payload.tournamentStatus)}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900">{payload.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  작성자 {payload.authorDisplayName} · {payload.tournamentPeriodLabel}
                </p>
                {payload.feeRequired && !payload.financeIntegrationEnabled ? (
                  <p className="mt-2 text-xs font-semibold leading-5 text-amber-700">
                    재정 연동이 꺼져 있어 참가비 납부는 운영진이 별도로 안내해야 합니다.
                  </p>
                ) : null}
              </div>
              <div className="w-full rounded-[var(--radius-card)] bg-slate-100 px-4 py-3 text-left sm:w-auto sm:text-right">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">신청/승인</p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {payload.applicantCount}/{payload.approvedCount}
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            id="tournament-approval-section"
            className={`mt-6 rounded-[var(--radius-modal)] border p-5 shadow-sm ${
              payload.approvalStatus === "REJECTED"
                ? "border-rose-200 bg-rose-50/70"
                : "border-violet-200 bg-violet-50/70"
            }`}
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.04 }}
          >
            <p className="text-xs font-black tracking-wide text-slate-500">승인 상태</p>
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

          {mode === "admin" && payload.canReviewTournament && payload.approvalStatus === "PENDING" ? (
            <motion.section
              id="tournament-review-section"
              className="mt-6 rounded-[var(--radius-modal)] border border-amber-200 bg-white p-5 shadow-sm"
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.08 }}
            >
              <p className="text-xs font-black tracking-wide text-amber-700">대회 검토</p>
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
                    className={`rounded-[var(--radius-card)] border px-4 py-3 text-sm font-black transition ${
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
                  aria-label="대회 거절 사유"
                  value={tournamentRejectionReason}
                  onChange={(event) => setTournamentRejectionReason(event.target.value)}
                  className="mt-4 block min-h-28 w-full rounded-[var(--radius-card)] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
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

          {payload.canManageApplications ? (
            <motion.section
              id="tournament-management-section"
              className="mt-6 rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm"
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.12 }}
            >
              <p className="text-xs font-black tracking-wide text-slate-400">참가 신청</p>
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
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black tracking-wide ${
                          application.applicationStatus === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700"
                            : application.applicationStatus === "REJECTED"
                              ? "bg-rose-50 text-rose-600"
                              : application.applicationStatus === "WAITLISTED"
                                ? "bg-violet-50 text-violet-700"
                              : "bg-amber-50 text-amber-700"
                        }`}>
                          {getApplicationStatusLabel(application)}
                        </span>
                      </div>
                      {application.teamName ? (
                        <div className="mt-3 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200">
                          <p className="text-xs font-black text-sky-700">{application.teamName}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {application.rosterMembers.map((member) => member.displayName).join(" · ")}
                          </p>
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {application.feePaymentStatusLabel ? (
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
                            참가비 {application.feePaymentStatusLabel}
                          </span>
                        ) : null}
                        {application.checkedInAtLabel ? (
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-700">
                            {application.checkedInAtLabel} 체크인
                          </span>
                        ) : null}
                        {application.placement ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                            {application.placement}위
                          </span>
                        ) : null}
                      </div>
                      {application.applicationStatus === "APPLIED" || application.applicationStatus === "WAITLISTED" ? (
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
                      {application.applicationStatus === "APPROVED" ? (
                        <ApplicationOperationsEditor
                          application={application}
                          saving={saving}
                          onSave={(request) => handleUpdateApplicationOperations(application, request)}
                        />
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </motion.section>
          ) : null}

          {payload.canManageApplications ? (
            <motion.section
              className="mt-6 rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm"
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.14 }}
            >
              <p className="text-xs font-black tracking-wide text-slate-400">코트 · 시간표</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">대회 일정 운영</h3>
              <div className="mt-4 space-y-3">
                {payload.scheduleSlots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-7 text-center text-sm text-slate-500">
                    세부 일정이 없습니다. 코트 배정과 경기 시간을 등록하세요.
                  </div>
                ) : payload.scheduleSlots.map((slot) => (
                  <div key={slot.tournamentScheduleSlotId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{slot.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {slot.startAtLabel} ~ {slot.endAtLabel}
                          {slot.courtLabel ? ` · ${slot.courtLabel}` : ""}
                        </p>
                        {slot.note ? <p className="mt-2 text-sm text-slate-600">{slot.note}</p> : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEditingScheduleSlot(slot)}
                          className="semo-icon-control bg-white text-slate-600 ring-1 ring-slate-200"
                          aria-label={`${slot.title} 수정`}
                        >
                          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduleSlot(slot.tournamentScheduleSlotId)}
                          disabled={saving}
                          className="semo-icon-control bg-white text-rose-600 ring-1 ring-rose-100 disabled:opacity-50"
                          aria-label={`${slot.title} 삭제`}
                        >
                          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-900">
                    {editingScheduleSlotId ? "일정 수정" : "새 일정 추가"}
                  </p>
                  {editingScheduleSlotId ? (
                    <button type="button" onClick={resetScheduleForm} className="text-xs font-bold text-slate-500">수정 취소</button>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="text-xs font-bold text-slate-600">일정 제목</span>
                    <input value={scheduleTitle} onChange={(event) => setScheduleTitle(event.target.value)} maxLength={150} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="예선 1라운드" />
                  </label>
                  <label>
                    <span className="text-xs font-bold text-slate-600">시작</span>
                    <input type="datetime-local" value={scheduleStartAt} onChange={(event) => setScheduleStartAt(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                  </label>
                  <label>
                    <span className="text-xs font-bold text-slate-600">종료</span>
                    <input type="datetime-local" value={scheduleEndAt} onChange={(event) => setScheduleEndAt(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" />
                  </label>
                  <label>
                    <span className="text-xs font-bold text-slate-600">코트·장소</span>
                    <input value={scheduleCourtLabel} onChange={(event) => setScheduleCourtLabel(event.target.value)} maxLength={100} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="1번 코트" />
                  </label>
                  <label>
                    <span className="text-xs font-bold text-slate-600">운영 메모</span>
                    <input value={scheduleNote} onChange={(event) => setScheduleNote(event.target.value)} maxLength={500} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm" placeholder="집결 안내" />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleSaveScheduleSlot}
                  disabled={saving || !scheduleTitle.trim() || !scheduleStartAt || !scheduleEndAt}
                  className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {saving ? "저장 중..." : editingScheduleSlotId ? "일정 수정 저장" : "일정 추가"}
                </button>
              </div>
            </motion.section>
          ) : null}

          <motion.section
            id="tournament-action-section"
            className="mt-6 rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm"
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.16 }}
          >
            <p className="text-xs font-black tracking-wide text-slate-400">관리 작업</p>
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
            <RouteModal ariaLabel="대회 수정" onDismiss={() => setShowEditModal(false)} dismissOnBackdrop={false}>
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
            confirmDisabled={!cancelReason.trim()}
            onCancel={() => {
              if (!saving) {
                setShowCancelTournament(false);
                setCancelReason("");
              }
            }}
            onConfirm={handleCancelTournament}
          >
            <label className="block text-left">
              <span className="text-xs font-bold text-slate-600">취소 사유</span>
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                maxLength={500}
                rows={3}
                disabled={saving}
                className="mt-2 block w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100 disabled:opacity-60"
                placeholder="참가자에게 안내할 취소 사유를 입력해 주세요."
              />
              <span className="mt-1.5 block text-right text-xs text-slate-400">{cancelReason.length}/500</span>
            </label>
          </ScheduleActionConfirmModal>
        ) : null}
        {showDeleteTournament ? (
          <ScheduleActionConfirmModal
            title="대회를 삭제할까요?"
            description="목록과 공유 화면에서 숨기되 신청·납부·운영 기록은 감사와 정산을 위해 보존합니다."
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

function getApplicationStatusLabel(application: TournamentApplicationSummary) {
  switch (application.applicationStatus) {
    case "APPLIED":
      return "검토 대기";
    case "WAITLISTED":
      return application.waitlistPosition ? `대기 ${application.waitlistPosition}번` : "대기 명단";
    case "APPROVED":
      return "참가 승인";
    case "REJECTED":
      return "반려";
    case "CANCELLED":
      return "신청 취소";
  }
}

function ApplicationOperationsEditor({
  application,
  saving,
  onSave,
}: {
  application: TournamentApplicationSummary;
  saving: boolean;
  onSave: (request: {
    checkedIn: boolean;
    placement: number | null;
    resultNote: string | null;
  }) => Promise<boolean>;
}) {
  const [checkedIn, setCheckedIn] = useState(Boolean(application.checkedInAtLabel));
  const [placement, setPlacement] = useState(application.placement?.toString() ?? "");
  const [resultNote, setResultNote] = useState(application.resultNote ?? "");
  const [expanded, setExpanded] = useState(false);

  const handleSave = async () => {
    const saved = await onSave({
      checkedIn,
      placement: placement ? Number(placement) : null,
      resultNote: resultNote.trim() || null,
    });
    if (saved) {
      setExpanded(false);
    }
  };

  return (
    <div className="mt-3 border-t border-slate-200 pt-3">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center justify-between text-left text-xs font-black text-slate-700"
        aria-expanded={expanded}
      >
        <span>체크인·결과 관리</span>
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          {expanded ? "expand_less" : "expand_more"}
        </span>
      </button>
      {expanded ? (
        <div className="mt-3 space-y-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <label className="flex items-center justify-between gap-4 text-sm font-semibold text-slate-700">
            <span>현장 체크인</span>
            <input
              type="checkbox"
              checked={checkedIn}
              onChange={(event) => setCheckedIn(event.target.checked)}
              className="size-5 accent-[var(--primary)]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-600">최종 순위</span>
            <input
              type="number"
              min={1}
              value={placement}
              onChange={(event) => setPlacement(event.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              placeholder="예: 1"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-600">결과 메모</span>
            <textarea
              value={resultNote}
              onChange={(event) => setResultNote(event.target.value)}
              maxLength={1000}
              className="mt-1.5 block min-h-20 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              placeholder="스코어, 수상 내역, 특이사항"
            />
          </label>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (placement !== "" && Number(placement) < 1)}
            className="w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "운영 정보 저장"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
