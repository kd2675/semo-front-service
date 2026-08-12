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
import { ClubDetailLoadingShell } from "../../../ClubRouteLoadingShells";

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
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applicationNote, setApplicationNote] = useState("");
  const [teamName, setTeamName] = useState("");
  const [selectedRosterIds, setSelectedRosterIds] = useState<number[]>([]);
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
    const result = await applyTournamentMutation.mutateAsync({
      applicationNote: applicationNote.trim() || null,
      teamName: payload?.matchFormat === "SINGLE" ? null : teamName.trim() || null,
      rosterClubProfileIds: selectedRosterIds,
    });
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
    setShowApplyForm(false);
    setApplicationNote("");
    setTeamName("");
    setSelectedRosterIds([]);
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
  const teammateOptions = payload.availableRosterMembers.filter(
    (member) => member.clubProfileId !== payload.viewerClubProfileId,
  );
  const minimumTeammateCount = payload.matchFormat === "DOUBLE" ? 1 : payload.matchFormat === "TEAM" ? 2 : 0;
  const maximumTeammateCount = payload.matchFormat === "DOUBLE"
    ? 1
    : payload.matchFormat === "TEAM"
      ? Math.max(2, (payload.teamMemberLimit ?? 3) - 1)
      : 0;
  const applicationFormValid = payload.matchFormat === "SINGLE"
    || (teamName.trim().length > 0
      && selectedRosterIds.length >= minimumTeammateCount
      && selectedRosterIds.length <= maximumTeammateCount);
  return (
    <div className={isModal ? "flex min-h-0 flex-1 flex-col bg-white font-display text-slate-900" : "min-h-full bg-white font-display text-slate-900"}>
      <div className={isModal ? "flex min-h-0 flex-1 flex-col bg-white" : "mx-auto flex min-h-full max-w-md flex-col bg-white"}>
        <ClubPageHeader
          title="대회 상세"
          subtitle={payload.clubName}
          icon="emoji_events"
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
              aria-label="대회 상세 닫기"
            >
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">close</span>
            </button>
          ) : undefined}
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 sm:max-w-[72%]">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-black text-white">대회</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${approvalBadgeClassName}`}>
                    {getTournamentApprovalLabel(payload.approvalStatus)}
                  </span>
                  {payload.approvalStatus === "APPROVED" ? (
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${statusBadgeClassName}`}>
                      {getTournamentStatusLabel(payload.tournamentStatus)}
                    </span>
                  ) : null}
                  {payload.pinned ? (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                      고정
                    </span>
                  ) : null}
                  {shareBadges.map((badge) => (
                    <span key={badge.label} className={`rounded-full px-3 py-1 text-xs font-black ${badge.className}`}>
                      {badge.label}
                    </span>
                  ))}
                </div>

                <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{payload.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {payload.summaryText ?? payload.detailText ?? "대회 소개가 아직 등록되지 않았습니다."}
                </p>
              </div>

              <div className="w-full rounded-[22px] bg-white/80 px-4 py-3 text-left shadow-sm sm:w-auto sm:text-right">
                <p className="text-xs font-black text-slate-400">기간</p>
                <p className="mt-1 text-lg font-black text-slate-900">{payload.tournamentPeriodLabel}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[20px] bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400">신청 기간</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{payload.applicationWindowLabel}</p>
              </div>
              <div className="rounded-[20px] bg-white/80 p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400">형식 / 참가비</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {getTournamentFormatLabel(payload.matchFormat)} · {getTournamentFeeLabel(payload)}
                </p>
                {payload.feeRequired && !payload.financeIntegrationEnabled ? (
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">납부 방법은 운영진이 별도로 안내합니다.</p>
                ) : null}
              </div>
            </div>
          </motion.section>

          <motion.section className="mt-6 space-y-4" {...staggeredFadeUpMotion(3, reduceMotion)}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400">신청 / 승인</p>
                <p className="mt-2 text-xl font-black tracking-tight text-slate-900">
                  {payload.applicantCount}
                  <span className="ml-2 text-xs font-semibold text-slate-400">신청 / {payload.approvedCount} 승인</span>
                </p>
              </div>
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400">참가 선수 / 제한</p>
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
                <p className="text-xs font-bold text-slate-400">장소</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{payload.locationLabel}</p>
              </div>
            ) : null}

            {payload.detailText ? (
              <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-400">상세 안내</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{payload.detailText}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              {mode !== "admin" && payload.canApply ? (
                <button
                  type="button"
                  onClick={() => setShowApplyForm((current) => !current)}
                  disabled={saving}
                  className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(19,91,236,0.2)] transition hover:opacity-95 disabled:opacity-60"
                >
                  {payload.myApplicationStatus === "REJECTED" ? "다시 신청" : "참가 신청"}
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

            {mode !== "admin" && payload.canApply && showApplyForm ? (
              <div className="rounded-[24px] border border-sky-200 bg-sky-50/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-slate-900">참가 정보</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      정원이 찬 경우 자동으로 대기 명단에 등록됩니다.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="semo-icon-control bg-white text-slate-500"
                    aria-label="참가 신청 폼 닫기"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
                  </button>
                </div>

                {payload.matchFormat !== "SINGLE" ? (
                  <div className="mt-4 space-y-4">
                    <label className="block">
                      <span className="text-xs font-bold text-slate-600">팀 이름</span>
                      <input
                        value={teamName}
                        onChange={(event) => setTeamName(event.target.value)}
                        maxLength={100}
                        className="mt-2 block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                        placeholder="팀을 구분할 이름을 입력하세요"
                      />
                    </label>
                    <fieldset>
                      <legend className="text-xs font-bold text-slate-600">
                        팀원 선택 · {payload.matchFormat === "DOUBLE" ? "1명" : `최소 2명, 최대 ${maximumTeammateCount}명`}
                      </legend>
                      <div className="mt-2 max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2">
                        {teammateOptions.length === 0 ? (
                          <p className="px-3 py-5 text-center text-xs text-slate-500">선택할 수 있는 활성 멤버가 없습니다.</p>
                        ) : teammateOptions.map((member) => {
                          const selected = selectedRosterIds.includes(member.clubProfileId);
                          return (
                            <label
                              key={member.clubProfileId}
                              className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${selected ? "bg-sky-50 text-sky-800" : "hover:bg-slate-50"}`}
                            >
                              <span className="font-semibold">{member.displayName}</span>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => setSelectedRosterIds((current) => {
                                  if (selected) {
                                    return current.filter((id) => id !== member.clubProfileId);
                                  }
                                  if (current.length >= maximumTeammateCount) {
                                    return current;
                                  }
                                  return [...current, member.clubProfileId];
                                })}
                                className="size-4 accent-[var(--primary)]"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  </div>
                ) : null}

                <label className="mt-4 block">
                  <span className="text-xs font-bold text-slate-600">운영진에게 남길 메모 · 선택</span>
                  <textarea
                    value={applicationNote}
                    onChange={(event) => setApplicationNote(event.target.value)}
                    maxLength={500}
                    className="mt-2 block min-h-24 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
                    placeholder="참가 신청과 함께 전달할 내용을 입력하세요"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={saving || !applicationFormValid}
                  className="mt-4 w-full rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {saving ? "신청 중..." : "참가 신청 제출"}
                </button>
              </div>
            ) : null}
          </motion.section>

          <motion.section
            className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(4, reduceMotion)}
          >
            <div className="mb-4">
              <p className="text-xs font-black tracking-wide text-slate-400">코트 · 시간표</p>
              <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">대회 일정</h3>
            </div>
            {payload.scheduleSlots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                아직 등록된 세부 일정이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {payload.scheduleSlots.map((slot) => (
                  <div key={slot.tournamentScheduleSlotId} className="rounded-2xl bg-slate-50 px-4 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{slot.title}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">{slot.startAtLabel} ~ {slot.endAtLabel}</p>
                      </div>
                      {slot.courtLabel ? (
                        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                          {slot.courtLabel}
                        </span>
                      ) : null}
                    </div>
                    {slot.note ? <p className="mt-3 text-sm leading-6 text-slate-600">{slot.note}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section
            className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(5, reduceMotion)}
          >
            <div className="mb-4">
              <p className="text-xs font-black tracking-wide text-slate-400">참가자</p>
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
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{participant.displayName}</p>
                      {participant.teamName ? <p className="mt-1 text-xs font-bold text-sky-700">{participant.teamName}</p> : null}
                      {participant.approvedAtLabel ? (
                        <p className="mt-1 text-xs font-medium text-slate-400">{participant.approvedAtLabel} 승인</p>
                      ) : null}
                      {participant.rosterMembers.length > 1 ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {participant.rosterMembers.map((member) => member.displayName).join(" · ")}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {participant.feePaymentStatusLabel ? (
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
                            참가비 {participant.feePaymentStatusLabel}
                          </span>
                        ) : null}
                        {participant.checkedInAtLabel ? (
                          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">체크인 완료</span>
                        ) : null}
                        {participant.placement ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">{participant.placement}위</span>
                        ) : null}
                      </div>
                      {participant.resultNote ? <p className="mt-2 text-xs text-slate-600">{participant.resultNote}</p> : null}
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
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
