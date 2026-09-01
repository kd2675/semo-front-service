"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { type ClubScheduleEventDetailResponse } from "@/app/lib/clubs";
import { getShareTargetBadges } from "@/app/lib/contentBadge";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import { updateScheduleParticipationMutationOptions } from "@/app/lib/react-query/schedule/mutations";
import {
  scheduleEventDetailQueryOptions,
  scheduleQueryKeys,
} from "@/app/lib/react-query/schedule/queries";

import { ClubDetailLoadingShell } from "../../ClubRouteLoadingShells";
import { ScheduleAttendanceModal } from "../modals/ScheduleAttendanceModal";

type ClubScheduleDetailClientProps = {
  clubId: string;
  eventId: string;
  presentation?: "page" | "modal";
  onRequestClose?: () => void;
};

function buildMapHref(locationLabel: string | null) {
  if (!locationLabel) {
    return null;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationLabel)}`;
}

function buildDurationLabel(payload: ClubScheduleEventDetailResponse) {
  if (!payload.startTime || !payload.endTime) {
    return null;
  }

  const endDate = payload.endDate ?? payload.startDate;
  const start = new Date(`${payload.startDate}T${payload.startTime}`);
  const end = new Date(`${endDate}T${payload.endTime}`);
  const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (!Number.isFinite(diffMinutes) || diffMinutes <= 0) {
    return null;
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

function formatFeeLabel(payload: ClubScheduleEventDetailResponse) {
  if (!payload.feeRequired) {
    return "무료";
  }
  if (payload.feeAmountUndecided) {
    return "금액 미정";
  }
  if (payload.feeAmount == null) {
    return "확인 필요";
  }
  if (payload.feeNWaySplit) {
    if (payload.goingCount <= 0) {
      return "계산 대기";
    }
    return `1인 ${new Intl.NumberFormat("ko-KR").format(Math.ceil(payload.feeAmount / payload.goingCount))}원`;
  }
  return `${new Intl.NumberFormat("ko-KR").format(payload.feeAmount)}원`;
}

function buildFeeDescription(payload: ClubScheduleEventDetailResponse) {
  if (!payload.feeRequired) {
    return "별도 참가비가 없는 일정입니다.";
  }
  if (payload.feeAmountUndecided) {
    return payload.feeNWaySplit
      ? "금액은 미정이며, 참석 인원 기준 1/n 정산 예정입니다."
      : "금액은 아직 미정입니다.";
  }
  if (payload.feeAmount == null) {
    return "참가비 정보를 확인해 주세요.";
  }
  if (!payload.feeNWaySplit) {
    return "등록된 참가비가 있는 일정입니다.";
  }
  if (payload.goingCount <= 0) {
    return `총 ${new Intl.NumberFormat("ko-KR").format(payload.feeAmount)}원이며, 참석 인원 확정 후 1/n 금액이 계산됩니다.`;
  }
  return `총 ${new Intl.NumberFormat("ko-KR").format(payload.feeAmount)}원을 현재 참석 ${payload.goingCount}명 기준으로 나눈 금액입니다.`;
}

function getAttendanceStatusLabel(status: ClubScheduleEventDetailResponse["myAttendanceStatus"]) {
  if (status === "PRESENT") {
    return "출석 확인";
  }
  if (status === "LATE") {
    return "지각 확인";
  }
  if (status === "ABSENT") {
    return "결석";
  }
  if (status === "EXCUSED") {
    return "사유 인정";
  }
  return "미확인";
}

export function ClubScheduleDetailClient({
  clubId,
  eventId,
  presentation = "page",
  onRequestClose,
}: ClubScheduleDetailClientProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const queryClient = useQueryClient();
  const {
    data: queryPayload,
    isPending: loading,
    error: queryError,
  } = useQuery(scheduleEventDetailQueryOptions(clubId, eventId));
  const [payloadState, setPayload] = useState<ClubScheduleEventDetailResponse | null>(null);
  const [savingParticipation, setSavingParticipation] = useState(false);
  const [pendingParticipationAction, setPendingParticipationAction] = useState<"GOING" | "NOT_GOING" | "CANCELED" | null>(null);
  const [showGoingParticipants, setShowGoingParticipants] = useState(false);
  const [showAttendanceManager, setShowAttendanceManager] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const participationMutation = useMutation(
    updateScheduleParticipationMutationOptions(clubId, eventId),
  );
  const payload = payloadState ?? queryPayload ?? null;
  const error = actionError ?? (queryError
    ? getQueryErrorMessage(queryError, "일정 상세를 불러오지 못했습니다.")
    : null);

  const handleParticipation = async (participationStatus: "GOING" | "NOT_GOING" | "CANCELED") => {
    setSavingParticipation(true);
    setPendingParticipationAction(participationStatus);
    setActionError(null);
    const result = await participationMutation.mutateAsync(participationStatus);
    setSavingParticipation(false);
    setPendingParticipationAction(null);
    if (!result.ok || !result.data) {
      setActionError(result.message ?? "참석 상태 저장에 실패했습니다.");
      return;
    }
    queryClient.setQueryData(scheduleQueryKeys.scheduleEventDetail(clubId, eventId), result.data);
    setPayload(result.data);
    void invalidateClubQueries(queryClient, clubId);
  };

  if (loading && !payload && !error) {
    return <ClubDetailLoadingShell />;
  }

  const mapHref = buildMapHref(payload?.locationLabel ?? null);
  const durationLabel = payload ? buildDurationLabel(payload) : null;
  const shareBadges = getShareTargetBadges({
    postedToBoard: payload?.postedToBoard,
    postedToCalendar: payload?.postedToCalendar,
  });
  const showParticipationActions = Boolean(payload?.participationEnabled);
  const showFooter = showParticipationActions;
  const isModal = presentation === "modal";
  const backHref = `/clubs/${clubId}/schedule`;

  return (
    <div className={isModal ? "flex min-h-0 flex-1 flex-col bg-white font-display text-slate-900" : "min-h-full bg-white font-display text-slate-900"}>
      <div className={`relative flex flex-col bg-white ${isModal ? "min-h-0 flex-1" : "semo-page-user min-h-full"}`}>
        <ClubPageHeader
          title="일정 상세"
          subtitle={payload?.clubName}
          icon="calendar_month"
          layout={isModal ? "modal" : "page"}
          containerClassName={isModal ? "max-w-none px-6" : "semo-page-user"}
          leftSlot={
            !isModal ? (
              <RouterLink
                href={backHref}
                className="rounded-full p-2 transition-colors hover:bg-slate-100"
                aria-label="일정 목록으로 돌아가기"
              >
                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">arrow_back</span>
              </RouterLink>
            ) : undefined
          }
          rightSlot={
            isModal && onRequestClose ? (
              <button
                type="button"
                onClick={onRequestClose}
                className="semo-icon-control transition-colors hover:bg-slate-100"
                aria-label="일정 상세 닫기"
              >
                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">close</span>
              </button>
            ) : undefined
          }
        />

        <main
          className={`flex-1 ${isModal ? "overflow-y-auto" : "semo-nav-bottom-space"}`}
        >
          {error ? (
            <motion.div
              className="mx-4 mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
              {...staggeredFadeUpMotion(1, reduceMotion)}
            >
              {error}
            </motion.div>
          ) : null}

          {payload ? (
            <>
              <motion.section className="bg-white p-6" {...staggeredFadeUpMotion(2, reduceMotion)}>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-[#e7effd] px-2 py-1 text-xs font-bold uppercase text-[var(--primary)]">
                    일정
                  </span>
                  {payload.pinned ? (
                    <span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-bold uppercase text-rose-600">
                      고정
                    </span>
                  ) : null}
                  {shareBadges.map((shareBadge) => (
                    <span
                      key={shareBadge.label}
                      className={`rounded-md px-2 py-1 text-xs font-bold uppercase ${shareBadge.className}`}
                    >
                      {shareBadge.label}
                    </span>
                  ))}
                </div>

                <h2 className="mb-4 text-2xl font-bold">{payload.title}</h2>

                <div className="space-y-3">
                  <div className="flex items-center text-slate-600">
                    <span className="material-symbols-outlined mr-3 text-[var(--primary)]" aria-hidden="true">calendar_today</span>
                    <span className="text-[15px]">{payload.dateLabel}</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <span className="material-symbols-outlined mr-3 text-[var(--primary)]" aria-hidden="true">schedule</span>
                    <span className="text-[15px]">
                      {payload.timeLabel ?? "시간 미정"}
                      {durationLabel ? <small className="ml-1 text-slate-400">({durationLabel})</small> : null}
                    </span>
                  </div>
                </div>
              </motion.section>

              <hr className="border-t-8 border-[#f9fafb]" />

              <motion.section className="space-y-8 p-6" {...staggeredFadeUpMotion(3, reduceMotion)}>
                {payload.locationLabel ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold tracking-wider text-slate-500">장소</h3>
                      {mapHref ? (
                        <a
                          href={mapHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[var(--primary)]"
                        >
                          지도 열기
                        </a>
                      ) : null}
                    </div>

                    <div className="mb-3 flex items-start gap-3">
                      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[var(--primary)]" aria-hidden="true">location_on</span>
                      <div>
                        <p className="font-semibold">{payload.locationLabel}</p>
                        <p className="text-sm text-slate-500">등록된 위치 정보를 기준으로 지도 앱으로 이동할 수 있습니다.</p>
                      </div>
                    </div>

                    <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-[linear-gradient(135deg,#f3f4f6_25%,#e5e7eb_100%)]">
                      <div className="flex flex-col items-center text-slate-400">
                        <span className="material-symbols-outlined mb-1 text-[32px]" aria-hidden="true">map</span>
                        <span className="text-xs font-bold uppercase tracking-[0.24em]">지도 미리보기</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setShowGoingParticipants(true)}
                    className="rounded-xl border border-[#f3f4f6] bg-[#f9fafb] p-4 text-left transition hover:border-[var(--primary)]/25 hover:bg-[#f5f8ff]"
                  >
                    <p className="mb-1 text-xs font-bold text-slate-400">참석 인원</p>
                    <p className="font-bold">
                      {payload.goingCount}
                      {payload.attendeeLimit ? ` / ${payload.attendeeLimit}` : ""}{" "}
                      <span className="text-xs font-normal text-slate-400">참석</span>
                    </p>
                    <p className="mt-2 text-xs font-medium text-[var(--primary)]">참석 명단 보기</p>
                  </button>
                  <div className="rounded-xl border border-[#f3f4f6] bg-[#f9fafb] p-4">
                    <p className="mb-1 text-xs font-bold text-slate-400">참석 조건</p>
                    <p className="font-bold">{payload.participationConditionText ?? "조건 없음"}</p>
                  </div>
                </div>

                {payload.attendanceEnabled ? (
                  <div className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold tracking-wider text-slate-500">실제 출석</h3>
                        <p className="mt-1 text-xs text-slate-400">참석 응답과 현장 확인은 별도로 기록됩니다.</p>
                      </div>
                      {payload.canManageAttendance ? (
                        <button
                          type="button"
                          onClick={() => setShowAttendanceManager(true)}
                          className="shrink-0 text-sm font-bold text-[var(--primary)]"
                        >
                          출석 관리
                        </button>
                      ) : null}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500">내 출석 상태</p>
                          <p className="mt-1 text-base font-bold text-slate-900">
                            {getAttendanceStatusLabel(payload.myAttendanceStatus)}
                          </p>
                        </div>
                        <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">
                          확인 {payload.presentCount + payload.lateCount} · 미확인 {payload.unmarkedCount}
                        </span>
                      </div>
                      {payload.myCheckedInAtLabel ? (
                        <p className="mt-3 text-xs text-slate-500">확인 시각 {payload.myCheckedInAtLabel}</p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">참가비 및 정산</h3>
                  <div className="flex items-center justify-between rounded-xl border border-[#e7effd] bg-[#e7effd]/40 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[var(--primary)] p-2 text-white">
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">payments</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[var(--primary)]">
                          {payload.feeRequired ? (payload.feeNWaySplit ? "1/n 정산" : "참가비 있음") : "무료"}
                        </p>
                        <p className="text-xs font-medium text-[var(--primary)]/70">
                          {buildFeeDescription(payload)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[var(--primary)]">{formatFeeLabel(payload)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">메모</h3>
                  <div className="rounded-xl bg-slate-50 p-4 text-[15px] leading-relaxed text-slate-700">
                    {payload.participationConditionText ?? "추가 메모가 없습니다."}
                  </div>
                </div>

              </motion.section>

              <div className={isModal ? "h-6" : showFooter ? "h-48" : "h-24"} />
            </>
          ) : null}
        </main>

        {showFooter && payload ? (
          <footer
            className={`${
              isModal ? "sticky" : "fixed left-0 right-0"
            } bottom-0 z-30 border-t border-[#f3f4f6] bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]`}
          >
            <div
              className={`mx-auto space-y-3 ${
                isModal
                  ? "max-w-none pb-[env(safe-area-inset-bottom)]"
                  : "max-w-[var(--page-user)] pb-[calc(env(safe-area-inset-bottom)+4.75rem)]"
              }`}
            >
              {showParticipationActions ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleParticipation("GOING")}
                      disabled={savingParticipation || payload.myParticipationStatus === "GOING"}
                      className={`rounded-2xl px-4 py-4 font-bold transition-all active:scale-[0.98] disabled:opacity-70 ${
                        payload.myParticipationStatus === "GOING"
                          ? "bg-[var(--primary)] text-white"
                          : "border border-[var(--primary)]/20 bg-[var(--primary)]/5 text-[var(--primary)]"
                      }`}
                      aria-pressed={payload.myParticipationStatus === "GOING"}
                    >
                      {savingParticipation && pendingParticipationAction === "GOING" ? "처리 중..." : "참석"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleParticipation("NOT_GOING")}
                      disabled={savingParticipation || payload.myParticipationStatus === "NOT_GOING"}
                      className={`rounded-2xl border px-4 py-4 font-bold transition-colors disabled:opacity-70 ${
                        payload.myParticipationStatus === "NOT_GOING"
                          ? "border-slate-500 bg-slate-700 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                      aria-pressed={payload.myParticipationStatus === "NOT_GOING"}
                    >
                      {savingParticipation && pendingParticipationAction === "NOT_GOING" ? "처리 중..." : "불참"}
                    </button>
                  </div>
                  {payload.myParticipationStatus && payload.myParticipationStatus !== "CANCELED" ? (
                    <button
                      type="button"
                      onClick={() => handleParticipation("CANCELED")}
                      disabled={savingParticipation}
                      className="w-full py-1 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
                    >
                      {savingParticipation && pendingParticipationAction === "CANCELED" ? "취소 중..." : "응답 취소"}
                    </button>
                  ) : null}
                </>
              ) : null}

            </div>
          </footer>
        ) : null}

        <AnimatePresence initial={false} mode="wait">
          {payload && showGoingParticipants ? (
            <RouteModal ariaLabel="일정 참석 명단" onDismiss={() => setShowGoingParticipants(false)} contentClassName="max-w-md">
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">참석 명단</p>
                    <p className="mt-1 text-xs text-slate-400">현재 {payload.goingCount}명 참석</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGoingParticipants(false)}
                    className="semo-icon-control rounded-full text-slate-500 transition hover:bg-slate-100"
                    aria-label="참석 명단 닫기"
                  >
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                  {payload.goingParticipants.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                      아직 참석한 멤버가 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payload.goingParticipants.map((participant) => {
                        const avatarUrl = participant.avatarThumbnailUrl ?? participant.avatarImageUrl;
                        return (
                          <div
                            key={participant.clubProfileId}
                            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
                          >
                            {avatarUrl ? (
                              <div
                                className="size-11 rounded-full bg-cover bg-center bg-no-repeat"
                                style={{ backgroundImage: `url('${avatarUrl}')` }}
                                aria-hidden="true"
                              />
                            ) : (
                              <div className="flex size-11 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)]">
                                {participant.displayName.slice(0, 1)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-900">{participant.displayName}</p>
                              <p className="mt-1 text-xs text-slate-400">참석 확정</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </RouteModal>
          ) : null}
          {payload && showAttendanceManager ? (
            <ScheduleAttendanceModal
              clubId={clubId}
              eventId={eventId}
              onDismiss={() => setShowAttendanceManager(false)}
            />
          ) : null}
        </AnimatePresence>

        {!isModal && payload?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
      </div>
    </div>
  );
}
