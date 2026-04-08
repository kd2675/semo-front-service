"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { type TournamentDetailResponse } from "@/app/lib/clubs";
import { getShareTargetBadges } from "@/app/lib/contentBadge";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import {
  getTournamentApprovalBadgeClassName,
  getTournamentApprovalLabel,
  getTournamentFeeLabel,
  getTournamentFormatLabel,
  getTournamentStatusBadgeClassName,
  getTournamentStatusLabel,
} from "@/app/lib/tournament";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import {
  applyTournamentMutationOptions,
  cancelTournamentApplicationMutationOptions,
} from "@/app/lib/react-query/tournaments/mutations";
import {
  tournamentDetailQueryOptions,
  tournamentQueryKeys,
} from "@/app/lib/react-query/tournaments/queries";
import { ClubDetailLoadingShell } from "../../ClubRouteLoadingShells";

type ClubTournamentDetailClientProps = {
  clubId: string;
  tournamentRecordId: string;
  mode?: "user" | "admin";
  presentation?: "page" | "modal";
  basePath?: string;
  onRequestClose?: () => void;
};

export function ClubTournamentDetailClient({
  clubId,
  tournamentRecordId,
  mode = "user",
  presentation = "page",
  basePath,
  onRequestClose,
}: ClubTournamentDetailClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const queryClient = useQueryClient();
  const {
    data: queryPayload,
    isPending: loading,
    error: queryError,
  } = useQuery(tournamentDetailQueryOptions(clubId, tournamentRecordId));
  const [payloadState, setPayload] = useState<TournamentDetailResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const applyTournamentMutation = useMutation(
    applyTournamentMutationOptions(clubId, tournamentRecordId),
  );
  const cancelTournamentApplicationMutation = useMutation(
    cancelTournamentApplicationMutationOptions(clubId, tournamentRecordId),
  );
  const payload = payloadState ?? queryPayload ?? null;
  const error =
    actionError ?? (queryError
      ? getQueryErrorMessage(queryError, "대회 상세를 불러오지 못했습니다.")
      : null);

  const isModal = presentation === "modal";
  const fallbackBasePath = basePath ?? `/clubs/${clubId}/more/tournaments`;
  const shareBadges = getShareTargetBadges({
    postedToBoard: payload?.postedToBoard,
    postedToCalendar: payload?.postedToCalendar,
  });

  const handleApply = async () => {
    setSaving(true);
    setActionError(null);
    const result = await applyTournamentMutation.mutateAsync();
    setSaving(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "대회 참가 신청에 실패했습니다.");
      return;
    }
    queryClient.setQueryData(
      tournamentQueryKeys.tournamentDetail(clubId, tournamentRecordId),
      result.data,
    );
    setPayload(result.data);
    void invalidateClubQueries(queryClient, clubId);
  };

  const handleCancelApplication = async () => {
    setSaving(true);
    setActionError(null);
    const result = await cancelTournamentApplicationMutation.mutateAsync();
    setSaving(false);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "참가 신청 취소에 실패했습니다.");
      return;
    }
    queryClient.setQueryData(
      tournamentQueryKeys.tournamentDetail(clubId, tournamentRecordId),
      result.data,
    );
    setPayload(result.data);
    void invalidateClubQueries(queryClient, clubId);
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
            </div>
          </motion.section>

          <motion.section
            className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(4, reduceMotion)}
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
      </div>
    </div>
  );
}
