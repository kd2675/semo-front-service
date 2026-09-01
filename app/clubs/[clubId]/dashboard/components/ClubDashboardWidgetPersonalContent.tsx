"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";
import { RouterLink } from "@/app/components/RouterLink";
import {
  type ClubPollSummary,
  type ScheduleAttendanceEventSummary,
  type ScheduleAttendanceStatus,
} from "@/app/lib/clubs";
import { getFinanceStatusClassName } from "../utils/dashboardWidgetUtils";
import type { ClubDashboardWidgetCardProps } from "../types/dashboardWidgetTypes";

type PersonalContentProps = Pick<
  ClubDashboardWidgetCardProps,
  | "clubId"
  | "widget"
  | "reduceMotion"
  | "attendanceData"
  | "attendanceLoading"
  | "attendanceError"
  | "financeData"
  | "financeLoading"
  | "financeError"
  | "pollData"
  | "pollLoading"
  | "pollError"
  | "decisionData"
  | "decisionLoading"
  | "decisionError"
>;

function getAttendanceStatusLabel(status: ScheduleAttendanceStatus) {
  if (status === "PRESENT") {
    return "출석";
  }
  if (status === "LATE") {
    return "지각";
  }
  if (status === "ABSENT") {
    return "결석";
  }
  return "사유 인정";
}

function getAttendanceEventStatusLabel(event: ScheduleAttendanceEventSummary | null) {
  if (!event) {
    return "정보 없음";
  }
  if (event.attendanceStatus) {
    return getAttendanceStatusLabel(event.attendanceStatus);
  }
  if (event.participationStatus === "GOING") {
    return "참석 예정";
  }
  if (event.participationStatus === "NOT_GOING") {
    return "불참 응답";
  }
  return "응답 필요";
}

export function ClubDashboardWidgetPersonalContent({
  clubId,
  widget,
  reduceMotion,
  attendanceData,
  attendanceLoading,
  attendanceError,
  financeData,
  financeLoading,
  financeError,
  pollData,
  pollLoading,
  pollError,
  decisionData,
  decisionLoading,
  decisionError,
}: PersonalContentProps) {
  const isAttendanceStatusWidget = widget.widgetKey === "ATTENDANCE_STATUS";
  const isAttendanceRecentWidget = widget.widgetKey === "ATTENDANCE_RECENT";
  const isFinanceStatusWidget = widget.widgetKey === "FINANCE_STATUS";
  const isFinanceLedgerWidget = widget.widgetKey === "FINANCE_LEDGER";
  const isPollStatusWidget = widget.widgetKey === "POLL_STATUS";
  const isPollPulseWidget = widget.widgetKey === "POLL_PULSE";
  const isDecisionLatestWidget = widget.widgetKey === "DECISION_LATEST";
  const latestDecision = decisionData?.records[0] ?? null;
  const nextAttendanceEvent = attendanceData?.nextEvent ?? null;
  const recentAttendanceEvents = useMemo(
    () => attendanceData?.recentEvents.slice(0, 3) ?? [],
    [attendanceData],
  );
  const nextFinanceObligation = financeData?.nextPayableObligation ?? null;
  const recentFinancePayments = financeData?.recentPayments.slice(0, 2) ?? [];
  const recentAttendanceRate = useMemo(() => {
    const eventsWithRsvp = recentAttendanceEvents.filter((event) => event.goingCount > 0);
    if (eventsWithRsvp.length === 0) {
      return null;
    }

    const totalRate = eventsWithRsvp.reduce((sum, event) => {
      return sum + event.attendedCount / event.goingCount;
    }, 0);
    return Math.round((totalRate / eventsWithRsvp.length) * 100);
  }, [recentAttendanceEvents]);
  const statusLabel = getAttendanceEventStatusLabel(nextAttendanceEvent);
  const statusClassName = nextAttendanceEvent?.attendanceStatus === "PRESENT"
    || nextAttendanceEvent?.attendanceStatus === "LATE"
    ? "bg-emerald-100 text-emerald-700"
    : nextAttendanceEvent?.participationStatus === "GOING"
      ? "bg-blue-100 text-blue-700"
      : "bg-slate-200 text-slate-600";
  const latestOngoingPoll = useMemo<ClubPollSummary | null>(() => {
    if (!pollData) {
      return null;
    }

    return [...pollData.polls]
      .filter((poll) => poll.voteStatus === "ONGOING")
      .sort((left, right) => {
        const leftValue = `${left.voteStartDate}T${left.voteTimeLabel ?? "00:00"}`;
        const rightValue = `${right.voteStartDate}T${right.voteTimeLabel ?? "00:00"}`;
        return rightValue.localeCompare(leftValue);
      })[0] ?? null;
  }, [pollData]);

  if (isDecisionLatestWidget) {
    return (
      <div className="space-y-3">
        {decisionLoading ? (
          <><div className="h-4 w-24 rounded-full bg-slate-100" /><div className="h-20 w-full rounded-xl bg-slate-50" /></>
        ) : decisionError ? (
          <p className="text-sm text-slate-500">최근 운영 결정을 가져오지 못했습니다.</p>
        ) : latestDecision ? (
          <RouterLink href={`/clubs/${clubId}/more/decisions`} className="block rounded-xl border border-[var(--primary)]/15 bg-[var(--primary)]/5 p-4 transition-colors hover:border-[var(--primary)]/35">
            <div className="flex items-center justify-between gap-2"><span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[var(--primary)]">{latestDecision.recordType === "MEETING_MINUTES" ? "회의록" : "운영 결정"}</span>{latestDecision.effectiveDate ? <span className="text-xs font-semibold text-slate-400">시행 {latestDecision.effectiveDate.replaceAll("-", ".")}</span> : null}</div>
            <p className="mt-3 line-clamp-1 text-sm font-bold text-slate-900">{latestDecision.title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{latestDecision.decisionContent}</p>
          </RouterLink>
        ) : (
          <><p className="text-sm font-semibold text-slate-900">공개된 운영 결정이 없습니다.</p><p className="text-xs leading-5 text-slate-500">운영진이 기록을 확정하면 이곳에서 바로 확인할 수 있습니다.</p></>
        )}
      </div>
    );
  }

  if (isAttendanceStatusWidget) {
    return (
      <div className="space-y-2">
        {attendanceLoading ? (
          <>
            <div className="h-4 w-32 rounded-full bg-slate-100" />
            <div className="h-4 w-full rounded-full bg-slate-100" />
            <div className="h-10 w-full rounded-xl bg-slate-50" />
          </>
        ) : attendanceError ? (
          <p className="text-sm text-slate-500">출석 정보를 가져오지 못했습니다.</p>
        ) : nextAttendanceEvent ? (
          <>
            <motion.p
              key={`attendance-title-${nextAttendanceEvent.eventId}`}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
              className="text-sm font-semibold text-slate-900"
            >
              {nextAttendanceEvent.title}
            </motion.p>
            <p className="text-xs text-slate-500">
              {nextAttendanceEvent.dateLabel}
              {nextAttendanceEvent.timeLabel ? ` · ${nextAttendanceEvent.timeLabel}` : ""}
            </p>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <motion.p
                key={`attendance-count-${nextAttendanceEvent.attendedCount}-${nextAttendanceEvent.goingCount}`}
                initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                className="text-xs font-medium text-slate-500"
              >
                {nextAttendanceEvent.attendedCount}/{nextAttendanceEvent.goingCount}명 도착 확인
              </motion.p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`attendance-status-${statusLabel}`}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 2 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: -2 }}
                  transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusClassName}`}
                >
                  {statusLabel}
                </motion.span>
              </AnimatePresence>
            </div>
            {nextAttendanceEvent.checkedInAtLabel ? (
              <p className="text-xs text-slate-400">확인 시각: {nextAttendanceEvent.checkedInAtLabel}</p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-500">참석 응답을 받을 예정 일정이 없습니다.</p>
        )}
      </div>
    );
  }

  if (isAttendanceRecentWidget) {
    return (
      <div className="space-y-3">
        {attendanceLoading ? (
          <>
            <div className="h-4 w-28 rounded-full bg-slate-100" />
            <div className="h-20 w-full rounded-xl bg-slate-50" />
          </>
        ) : attendanceError ? (
          <p className="text-sm text-slate-500">출석 기록을 가져오지 못했습니다.</p>
        ) : recentAttendanceEvents.length > 0 ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-violet-600">최근 출석</p>
                <p className="mt-2 text-base font-bold text-slate-900">평균 출석률 {recentAttendanceRate ?? 0}%</p>
              </div>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700">
                최근 {recentAttendanceEvents.length}회
              </span>
            </div>
            <div className="space-y-2">
              {recentAttendanceEvents.map((event) => {
                const completionRate = event.goingCount > 0
                  ? Math.round((event.attendedCount / event.goingCount) * 100)
                  : 0;
                return (
                  <div key={`${widget.widgetKey}-${event.eventId}`} className="rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-slate-900">{event.title}</p>
                      <span className="text-xs font-bold text-violet-700">{completionRate}%</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {event.dateLabel} · {event.attendedCount}/{event.goingCount}명 확인
                      {event.attendanceStatus ? ` · 내 상태 ${getAttendanceStatusLabel(event.attendanceStatus)}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">최근 출석 기록이 아직 없습니다.</p>
        )}
      </div>
    );
  }

  if (isFinanceStatusWidget) {
    return (
      <div className="space-y-3">
        {financeLoading ? (
          <>
            <div className="h-4 w-24 rounded-full bg-slate-100" />
            <div className="h-20 w-full rounded-xl bg-slate-50" />
          </>
        ) : financeError ? (
          <p className="text-sm text-slate-500">재정 정보를 가져오지 못했습니다.</p>
        ) : nextFinanceObligation ? (
          <RouterLink
            href={`/clubs/${clubId}/more/finance`}
            className="block rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-emerald-600">내 회비</p>
                <p className="mt-2 line-clamp-2 text-base font-bold text-slate-900">{nextFinanceObligation.title}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${getFinanceStatusClassName(
                  nextFinanceObligation.payment.paymentStatusCode,
                )}`}
              >
                {nextFinanceObligation.payment.paymentStatusLabel}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-500">{nextFinanceObligation.dueAtLabel ?? "재정 항목"}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{nextFinanceObligation.amountLabel}</p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50/60 px-3 py-2">
              <p className="text-xs font-medium text-slate-500">
                미납 {financeData?.pendingPaymentCount ?? 0}건 · 연체 {financeData?.overduePaymentCount ?? 0}건
              </p>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-emerald-700">
                {financeData?.totalPendingAmountLabel ?? nextFinanceObligation.amountLabel}
              </span>
            </div>
          </RouterLink>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-900">현재 확인할 재정 항목이 없습니다.</p>
            <p className="text-xs text-slate-500">새 재정 항목이 발행되면 이 위젯에서 바로 확인할 수 있습니다.</p>
          </>
        )}
      </div>
    );
  }

  if (isFinanceLedgerWidget) {
    return (
      <div className="space-y-3">
        {financeLoading ? (
          <>
            <div className="h-4 w-24 rounded-full bg-slate-100" />
            <div className="h-24 w-full rounded-xl bg-slate-50" />
          </>
        ) : financeError ? (
          <p className="text-sm text-slate-500">재정 요약을 가져오지 못했습니다.</p>
        ) : financeData ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-teal-50 px-3 py-3">
                <p className="text-xs font-bold text-teal-700">대기 중</p>
                <p className="mt-2 text-sm font-bold text-slate-900">{financeData.totalPendingAmountLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{financeData.pendingPaymentCount}건 미납</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-3">
                <p className="text-xs font-bold text-emerald-700">납부</p>
                <p className="mt-2 text-sm font-bold text-slate-900">{financeData.totalPaidAmountLabel}</p>
                <p className="mt-1 text-xs text-slate-500">{financeData.paidPaymentCount}건 완료</p>
              </div>
            </div>
            {recentFinancePayments[0] ? (
              <div className="rounded-xl border border-teal-100 bg-white px-3 py-3">
                <p className="text-xs font-semibold text-slate-500">최근 처리</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{recentFinancePayments[0].title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {recentFinancePayments[0].payment.paymentStatusLabel} · {recentFinancePayments[0].amountLabel}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-slate-500">재정 요약 데이터가 아직 없습니다.</p>
        )}
      </div>
    );
  }

  if (isPollStatusWidget) {
    return (
      <div className="space-y-3">
        {pollLoading ? (
          <>
            <div className="h-4 w-24 rounded-full bg-slate-100" />
            <div className="h-20 w-full rounded-xl bg-slate-50" />
          </>
        ) : pollError ? (
          <p className="text-sm text-slate-500">진행 중인 투표를 가져오지 못했습니다.</p>
        ) : latestOngoingPoll ? (
          <RouterLink
            href={`/clubs/${clubId}/schedule/votes/${latestOngoingPoll.voteId}`}
            className="block rounded-xl border border-amber-100 bg-white p-4 shadow-sm transition-all hover:border-amber-300"
          >
            <p className="text-xs font-semibold text-amber-600">진행 중인 투표</p>
            <p className="mt-2 line-clamp-2 text-base font-bold text-slate-900">{latestOngoingPoll.title}</p>
            <p className="mt-1 text-sm text-slate-500">
              {latestOngoingPoll.votePeriodLabel}
              {latestOngoingPoll.voteTimeLabel ? ` · ${latestOngoingPoll.voteTimeLabel}` : ""}
            </p>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2">
              <p className="text-xs font-medium text-slate-500">
                {latestOngoingPoll.totalResponses}명 참여 · 선택지 {latestOngoingPoll.optionCount}개
              </p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600">진행 중</span>
            </div>
          </RouterLink>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-900">현재 진행 중인 투표가 없습니다.</p>
            <p className="text-xs text-slate-500">진행 상태의 가장 최근 투표 1건이 이 위젯에 표시됩니다.</p>
          </>
        )}
      </div>
    );
  }

  if (isPollPulseWidget) {
    return (
      <div className="space-y-3">
        {pollLoading ? (
          <>
            <div className="h-4 w-24 rounded-full bg-slate-100" />
            <div className="h-20 w-full rounded-xl bg-slate-50" />
          </>
        ) : pollError ? (
          <p className="text-sm text-slate-500">투표 지표를 가져오지 못했습니다.</p>
        ) : pollData ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-slate-100 px-3 py-3">
                <p className="text-xs font-bold text-slate-600">대기</p>
                <p className="mt-2 text-base font-bold text-slate-900">{pollData.waitingCount}</p>
              </div>
              <div className="rounded-xl bg-orange-50 px-3 py-3">
                <p className="text-xs font-bold text-orange-700">진행</p>
                <p className="mt-2 text-base font-bold text-slate-900">{pollData.ongoingCount}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-3">
                <p className="text-xs font-bold text-emerald-700">종료</p>
                <p className="mt-2 text-base font-bold text-slate-900">{pollData.closedCount}</p>
              </div>
            </div>
            {latestOngoingPoll ? <p className="text-xs text-slate-500">현재 진행 중: {latestOngoingPoll.title}</p> : null}
          </>
        ) : (
          <p className="text-sm text-slate-500">투표 데이터가 아직 없습니다.</p>
        )}
      </div>
    );
  }

  return null;
}
