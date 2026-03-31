"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubTournamentEditorClient } from "@/app/clubs/[clubId]/more/tournaments/ClubTournamentEditorClient";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import {
  applyClubTournament,
  cancelClubTournament,
  cancelClubTournamentApplication,
  deleteClubTournament,
  getClubTournamentDetail,
  reviewClubTournament,
  reviewClubTournamentApplication,
  type TournamentApplicationSummary,
  type TournamentDetailResponse,
} from "@/app/lib/clubs";
import { getShareTargetBadges } from "@/app/lib/content-badge";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import {
  getTournamentApprovalBadgeClassName,
  getTournamentApprovalLabel,
  getTournamentFeeLabel,
  getTournamentFormatLabel,
  getTournamentStatusBadgeClassName,
  getTournamentStatusLabel,
} from "@/app/lib/tournament";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { ClubDetailLoadingShell } from "../../ClubRouteLoadingShells";

type ClubTournamentDetailClientProps = {
  clubId: string;
  tournamentRecordId: string;
  mode?: "user" | "admin";
  presentation?: "page" | "modal";
  basePath?: string;
  onRequestClose?: () => void;
  onDeleted?: () => void;
};

export function ClubTournamentDetailClient({
  clubId,
  tournamentRecordId,
  mode = "user",
  presentation = "page",
  basePath,
  onRequestClose,
  onDeleted,
}: ClubTournamentDetailClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [payload, setPayload] = useState<TournamentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelTournament, setShowCancelTournament] = useState(false);
  const [showDeleteTournament, setShowDeleteTournament] = useState(false);
  const [tournamentReviewStatus, setTournamentReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [tournamentRejectionReason, setTournamentRejectionReason] = useState("");

  const isModal = presentation === "modal";
  const fallbackBasePath = basePath ?? `/clubs/${clubId}/more/tournaments`;
  const shareBadges = getShareTargetBadges({
    postedToBoard: payload?.postedToBoard,
    postedToCalendar: payload?.postedToCalendar,
  });

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getClubTournamentDetail(clubId, tournamentRecordId);
    setLoading(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "대회 상세를 불러오지 못했습니다.");
      return;
    }
    setPayload(result.data);
  }, [clubId, tournamentRecordId]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      const result = await getClubTournamentDetail(clubId, tournamentRecordId);
      if (cancelled) {
        return;
      }
      setLoading(false);
      if (!result.ok || !result.data) {
        setError(result.message ?? "대회 상세를 불러오지 못했습니다.");
        return;
      }
      setPayload(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, tournamentRecordId]);

  const handleApply = async () => {
    setSaving(true);
    const result = await applyClubTournament(clubId, tournamentRecordId, {});
    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "대회 참가 신청에 실패했습니다.");
      return;
    }
    setPayload(result.data);
  };

  const handleCancelApplication = async () => {
    setSaving(true);
    const result = await cancelClubTournamentApplication(clubId, tournamentRecordId);
    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "참가 신청 취소에 실패했습니다.");
      return;
    }
    setPayload(result.data);
  };

  const handleCancelTournament = async () => {
    setSaving(true);
    const result = await cancelClubTournament(clubId, tournamentRecordId, { cancelReason: "작성자가 조기 취소" });
    setSaving(false);
    setShowCancelTournament(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "대회 취소에 실패했습니다.");
      return;
    }
    setPayload(result.data);
  };

  const handleDeleteTournament = async () => {
    setSaving(true);
    const result = await deleteClubTournament(clubId, tournamentRecordId);
    setSaving(false);
    setShowDeleteTournament(false);
    if (!result.ok) {
      setError(result.message ?? "대회 삭제에 실패했습니다.");
      return;
    }
    if (onDeleted) {
      onDeleted();
      return;
    }
    window.location.href = fallbackBasePath;
  };

  const handleReviewApplication = async (
    application: TournamentApplicationSummary,
    applicationStatus: "APPROVED" | "REJECTED",
  ) => {
    setSaving(true);
    const result = await reviewClubTournamentApplication(
      clubId,
      tournamentRecordId,
      application.tournamentApplicationId,
      { applicationStatus },
    );
    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "참가 신청 처리에 실패했습니다.");
      return;
    }
    setPayload(result.data);
  };

  const handleReviewTournament = async () => {
    setSaving(true);
    const result = await reviewClubTournament(clubId, tournamentRecordId, {
      approvalStatus: tournamentReviewStatus,
      rejectionReason: tournamentReviewStatus === "REJECTED"
        ? tournamentRejectionReason.trim() || null
        : null,
    });
    setSaving(false);
    if (!result.ok || !result.data) {
      setError(result.message ?? "대회 승인 검토에 실패했습니다.");
      return;
    }
    setPayload(result.data);
    if (result.data.approvalStatus !== "REJECTED") {
      setTournamentRejectionReason("");
      setTournamentReviewStatus("APPROVED");
    }
  };

  const moveToManagement = () => {
    const section = document.getElementById("tournament-management-section");
    if (!section) {
      return;
    }
    section.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  if (loading && !payload) {
    return <ClubDetailLoadingShell />;
  }

  if (!payload) {
    return (
      <div className="px-4 py-8 text-sm font-medium text-rose-600">
        {error ?? "대회 정보를 찾을 수 없습니다."}
      </div>
    );
  }

  const statusBadgeClassName = getTournamentStatusBadgeClassName(payload.tournamentStatus);
  const approvalBadgeClassName = getTournamentApprovalBadgeClassName(payload.approvalStatus);
  return (
    <div className={isModal ? "flex min-h-0 flex-1 flex-col bg-white font-display text-slate-900" : "min-h-full bg-white font-display text-slate-900"}>
      <div className={isModal ? "flex min-h-0 flex-1 flex-col bg-white" : "mx-auto flex min-h-full max-w-md flex-col bg-white"}>
        <ClubPageHeader
          title="대회 상세"
          subtitle={payload.clubName}
          icon="emoji_events"
          leftSlot={isModal && onRequestClose ? (
            <button
              type="button"
              onClick={onRequestClose}
              className="rounded-full p-2 transition-colors hover:bg-slate-100"
              aria-label="대회 상세 닫기"
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
            <motion.div
              className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
              {...staggeredFadeUpMotion(1, reduceMotion)}
            >
              {error}
            </motion.div>
          ) : null}

          <motion.section
            className="overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#e9f0ff_0%,#ffffff_55%,#f2f6ff_100%)] p-6 shadow-[0_18px_50px_rgba(0,75,202,0.12)] ring-1 ring-sky-100"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-[72%]">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white">대회</span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${approvalBadgeClassName}`}>
                    {getTournamentApprovalLabel(payload.approvalStatus)}
                  </span>
                  {payload.approvalStatus === "APPROVED" ? (
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${statusBadgeClassName}`}>
                      {getTournamentStatusLabel(payload.tournamentStatus)}
                    </span>
                  ) : null}
                  {payload.pinned ? (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-red-600">
                      고정
                    </span>
                  ) : null}
                  {shareBadges.map((badge) => (
                    <span key={badge.label} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${badge.className}`}>
                      {badge.label}
                    </span>
                  ))}
                </div>

                <h2 className="text-3xl font-black tracking-tight text-slate-900">{payload.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {payload.summaryText ?? payload.detailText ?? "대회 소개가 아직 등록되지 않았습니다."}
                </p>
              </div>

              <div className="rounded-[22px] bg-white/80 px-4 py-3 text-right shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">기간</p>
                <p className="mt-1 text-lg font-black text-slate-900">{payload.tournamentPeriodLabel}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] bg-white/80 p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">신청 기간</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{payload.applicationWindowLabel}</p>
              </div>
              <div className="rounded-[20px] bg-white/80 p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">형식 / 참가비</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {getTournamentFormatLabel(payload.matchFormat)} · {getTournamentFeeLabel(payload)}
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section className="mt-6 space-y-4" {...staggeredFadeUpMotion(3, reduceMotion)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">신청 / 승인</p>
                <p className="mt-2 text-xl font-black tracking-tight text-slate-900">
                  {payload.applicantCount}
                  <span className="ml-2 text-xs font-semibold text-slate-400">신청 / {payload.approvedCount} 승인</span>
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">참가 선수 / 제한</p>
                <p className="mt-2 text-xl font-black tracking-tight text-slate-900">
                  {payload.participantCount}
                  <span className="ml-2 text-xs font-semibold text-slate-400">
                    참가 선수{payload.participantLimit ? ` / ${payload.participantLimit}` : ""}
                  </span>
                </p>
              </div>
            </div>

            {payload.locationLabel ? (
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">장소</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{payload.locationLabel}</p>
              </div>
            ) : null}

            {payload.detailText ? (
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">상세 안내</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{payload.detailText}</p>
              </div>
            ) : null}

            {payload.approvalStatus !== "APPROVED" || payload.reviewedAtLabel || payload.rejectionReason ? (
              <div className={`rounded-[22px] border p-4 shadow-sm ${
                payload.approvalStatus === "REJECTED"
                  ? "border-rose-200 bg-rose-50/70"
                  : "border-violet-200 bg-violet-50/70"
              }`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">승인 상태</p>
                <p className="mt-2 text-base font-black text-slate-900">
                  {getTournamentApprovalLabel(payload.approvalStatus)}
                </p>
                {payload.reviewedAtLabel ? (
                  <p className="mt-2 text-sm font-medium text-slate-600">
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
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {mode !== "admin" && payload.canApply ? (
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={saving}
                  className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(19,91,236,0.2)] transition hover:opacity-95 disabled:opacity-60"
                >
                  참가 신청
                </button>
              ) : null}
              {mode !== "admin" && payload.applied && payload.myApplicationStatus !== "CANCELLED" ? (
                <button
                  type="button"
                  onClick={handleCancelApplication}
                  disabled={saving}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  신청 취소
                </button>
              ) : null}
              {mode !== "admin" && payload.canManageApplications ? (
                <button
                  type="button"
                  onClick={moveToManagement}
                  className="rounded-full border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100"
                >
                  신청 관리
                </button>
              ) : null}
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
            </div>
          </motion.section>

          {mode === "admin" && payload.canReviewTournament && payload.approvalStatus !== "APPROVED" ? (
            <motion.section className="mt-8 rounded-[28px] border border-amber-200 bg-white p-5 shadow-sm" {...staggeredFadeUpMotion(4, reduceMotion)}>
              <div className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-700">Tournament Review</p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">대회 승인 검토</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
              {...staggeredFadeUpMotion(4, reduceMotion)}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Applications</p>
                  <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">참가 신청 관리</h3>
                </div>
              </div>
              <div className="space-y-3">
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
                          <button type="button" onClick={() => handleReviewApplication(application, "APPROVED")} className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white">
                            승인
                          </button>
                          <button type="button" onClick={() => handleReviewApplication(application, "REJECTED")} className="rounded-full bg-rose-600 px-4 py-2 text-xs font-black text-white">
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
            className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(mode !== "admin" && payload.canManageApplications ? 5 : 4, reduceMotion)}
          >
            <div className="mb-4">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Participants</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">참가 선수</h3>
            </div>
            <div className="space-y-3">
              {payload.participants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  아직 확정된 참가 선수가 없습니다.
                </div>
              ) : (
                payload.participants.map((participant) => (
                  <div key={participant.clubProfileId} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{participant.displayName}</p>
                      {participant.approvedAtLabel ? (
                        <p className="mt-1 text-xs font-medium text-slate-400">{participant.approvedAtLabel} 승인</p>
                      ) : null}
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                      참가 확정
                    </span>
                  </div>
                ))
              )}
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
                  void loadDetail();
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
