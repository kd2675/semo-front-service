"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { startTransition, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { RouteModal } from "@/app/components/RouteModal";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type {
  ClubScheduleEventSummary,
  ClubScheduleResponse,
  ClubScheduleVoteSummary,
} from "@/app/lib/clubs";
import { ClubScheduleEditorClient } from "./ClubScheduleEditorClient";
import { ClubScheduleVoteEditorClient } from "./ClubScheduleVoteEditorClient";
import { ClubScheduleLoadingShell } from "../ClubRouteLoadingShells";

type ScheduleClientProps = {
  clubId: string;
  payload: ClubScheduleResponse;
  activeYear: number;
  activeMonth: number;
  isMonthLoading: boolean;
  onChangeMonth: (year: number, month: number) => void;
};

type CalendarMonth = {
  id: string;
  label: string;
  shortLabel: string;
  year: number;
  month: number;
  leadingBlankDays: number;
  daysInMonth: number;
  defaultSelectedDay: number;
  eventsByDay: Record<number, ClubScheduleEventSummary[]>;
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function getMonthId(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function getDateValue(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftMonth(year: number, month: number, delta: number) {
  const shiftedDate = new Date(year, month - 1 + delta, 1);
  return {
    year: shiftedDate.getFullYear(),
    month: shiftedDate.getMonth() + 1,
  };
}

function buildCalendarMonth(year: number, month: number, events: ClubScheduleEventSummary[]): CalendarMonth {
  const today = new Date();
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlankDays = firstDay.getDay();
  const id = getMonthId(year, month);
  const eventsByDay = events.reduce<Record<number, ClubScheduleEventSummary[]>>((acc, event) => {
    const startDate = new Date(`${event.startDate}T00:00:00`);
    const endDate = new Date(`${(event.endDate ?? event.startDate)}T00:00:00`);
    for (const cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
      if (cursor.getFullYear() !== year || cursor.getMonth() + 1 !== month) {
        continue;
      }
      const day = cursor.getDate();
      acc[day] = [...(acc[day] ?? []), event];
    }
    return acc;
  }, {});

  return {
    id,
    label: firstDay.toLocaleDateString("ko-KR", { year: "numeric", month: "long" }),
    shortLabel: `${month}월`,
    year,
    month,
    leadingBlankDays,
    daysInMonth,
    defaultSelectedDay:
      year === today.getFullYear() && month === today.getMonth() + 1 ? today.getDate() : 1,
    eventsByDay,
  };
}

function getEventVisual(event: ClubScheduleEventSummary) {
  if (event.feeRequired) {
    return {
      icon: "paid",
      iconClassName: "text-amber-500",
      iconSurfaceClassName: "bg-amber-500/10",
    };
  }
  if (event.locationLabel) {
    return {
      icon: "sports_tennis",
      iconClassName: "text-[var(--primary)]",
      iconSurfaceClassName: "bg-[var(--primary)]/10",
    };
  }
  return {
    icon: "event",
    iconClassName: "text-slate-500",
    iconSurfaceClassName: "bg-slate-100",
  };
}

function getEventSecondaryText(event: ClubScheduleEventSummary) {
  const parts = [event.locationLabel, event.participationConditionText].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "세부 안내 없음";
}

function getEventStatusLabel(event: ClubScheduleEventSummary) {
  if (!event.participationEnabled) {
    return "OPEN";
  }
  if (event.myParticipationStatus === "GOING") {
    return "JOINED";
  }
  if (event.myParticipationStatus === "NOT_GOING") {
    return "DECLINED";
  }
  return "RSVP";
}

function isVoteActiveOnDate(vote: ClubScheduleVoteSummary, dateValue: string | undefined) {
  if (!dateValue) {
    return true;
  }
  return vote.voteStartDate <= dateValue && dateValue <= vote.voteEndDate;
}

function getEventDotClassName(eventCount: number, maxEventCount: number, isActive: boolean) {
  if (eventCount <= 0 || maxEventCount <= 0) {
    return "";
  }

  const ratio = (eventCount / maxEventCount) * 100;
  if (ratio > 75) {
    return "bg-red-500";
  }
  if (ratio > 50) {
    return "bg-orange-500";
  }
  if (ratio > 25) {
    return "bg-yellow-400";
  }
  if (ratio > 0) {
    return isActive ? "bg-white" : "bg-white ring-1 ring-slate-300";
  }
  return "";
}

function EventCard({
  clubId,
  event,
}: {
  clubId: string;
  event: ClubScheduleEventSummary;
}) {
  const visual = getEventVisual(event);

  return (
    <RouterLink
      href={`/clubs/${clubId}/schedule/${event.eventId}`}
      className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-[var(--primary)]/50"
    >
      <div
        className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${visual.iconSurfaceClassName} ${visual.iconClassName}`}
      >
        <span className="material-symbols-outlined">{visual.icon}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <p className="mb-1 text-base font-bold leading-none text-slate-900">{event.title}</p>
        <p className="text-sm font-normal text-slate-500">{getEventSecondaryText(event)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-slate-900">{event.timeLabel ?? "종일"}</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {getEventStatusLabel(event)}
        </p>
      </div>
    </RouterLink>
  );
}

function VoteCard({
  clubId,
  vote,
}: {
  clubId: string;
  vote: ClubScheduleVoteSummary;
}) {
  return (
    <RouterLink
      href={`/clubs/${clubId}/schedule/votes/${vote.voteId}`}
      className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-amber-500/50"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
        <span className="material-symbols-outlined">poll</span>
      </div>
      <div className="flex flex-1 flex-col justify-center">
        <p className="mb-1 text-base font-bold leading-none text-slate-900">{vote.title}</p>
        <p className="text-sm font-normal text-slate-500">
          {vote.votePeriodLabel}
          {vote.voteTimeLabel ? ` • ${vote.voteTimeLabel}` : ""}
          {` • ${vote.optionCount}개 항목`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-slate-900">{vote.totalResponses}명</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {!vote.votingOpen ? "CLOSED" : vote.mySelectedOptionId ? "VOTED" : "PENDING"}
        </p>
      </div>
    </RouterLink>
  );
}

export function ScheduleClient({
  clubId,
  payload,
  activeYear,
  activeMonth,
  isMonthLoading,
  onChangeMonth,
}: ScheduleClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const isRealClub = !Number.isNaN(Number(clubId));
  const canManageSchedule = payload.admin && isRealClub;
  const month = useMemo(
    () => buildCalendarMonth(activeYear, activeMonth, payload.monthEvents),
    [activeMonth, activeYear, payload.monthEvents],
  );
  const [selectedDay, setSelectedDay] = useState(month.defaultSelectedDay);
  const [showEventCreateModal, setShowEventCreateModal] = useState(false);
  const [showVoteCreateModal, setShowVoteCreateModal] = useState(false);

  if (!month) {
    return <ClubScheduleLoadingShell />;
  }

  const events = month.eventsByDay[selectedDay] ?? [];
  const selectedDateValue = getDateValue(month.year, month.month, selectedDay);
  const votes = payload.votes.filter((vote) => isVoteActiveOnDate(vote, selectedDateValue));
  const maxEventCount = Math.max(0, ...Object.values(month.eventsByDay).map((dayEvents) => dayEvents.length));
  const nextUpcomingEvent = payload.monthEvents.find((event) => {
    const eventLastDate = event.endDate ?? event.startDate;
    return eventLastDate > selectedDateValue;
  });

  const handleMoveMonth = (direction: "prev" | "next") => {
    const next = shiftMonth(activeYear, activeMonth, direction === "prev" ? -1 : 1);
    onChangeMonth(next.year, next.month);
  };

  const handleSelectDay = (day: number) => {
    startTransition(() => {
      setSelectedDay(day);
    });
  };

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-[var(--background-light)]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <RouterLink
            href={`/clubs/${clubId}`}
            className="flex size-10 shrink-0 items-center justify-center text-slate-900"
            aria-label={`${payload.clubName} 홈으로 돌아가기`}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </RouterLink>
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight">일정</h2>
          <div className="flex items-center justify-end gap-2 pl-4">
            {canManageSchedule ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowEventCreateModal(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
                  aria-label="일정 추가"
                >
                  <span className="material-symbols-outlined text-[22px]">add</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowVoteCreateModal(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 transition-colors hover:bg-amber-500/20"
                  aria-label="투표 추가"
                >
                  <span className="material-symbols-outlined text-[22px]">poll</span>
                </button>
              </>
            ) : null}
          </div>
        </header>

        <div className="relative flex-1 pb-28">
          <motion.div className="bg-white p-4 shadow-sm" {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleMoveMonth("prev")}
                className="rounded-full p-1 text-slate-900 transition-colors hover:bg-slate-100"
                aria-label="이전 달"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <p className="text-base font-bold text-slate-900">{month.label}</p>
              <button
                type="button"
                onClick={() => handleMoveMonth("next")}
                className="rounded-full p-1 text-slate-900 transition-colors hover:bg-slate-100"
                aria-label="다음 달"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 text-center">
              {WEEKDAY_LABELS.map((label, index) => (
                <p key={`${month.id}-weekday-${index}`} className="py-2 text-xs font-bold text-slate-400">
                  {label}
                </p>
              ))}

              {Array.from({ length: month.leadingBlankDays }, (_, index) => (
                <div key={`${month.id}-blank-${index + 1}`} className="h-10" />
              ))}

              {Array.from({ length: month.daysInMonth }, (_, index) => {
                const day = index + 1;
                const isActive = day === selectedDay;
                const eventCount = (month.eventsByDay[day] ?? []).length;
                const hasEvents = eventCount > 0;
                const eventDotClassName = getEventDotClassName(eventCount, maxEventCount, isActive);

                return (
                  <button
                    key={`${month.id}-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className="flex h-10 w-full items-center justify-center text-sm font-medium"
                  >
                    {isActive ? (
                      <div className="relative flex size-8 items-center justify-center rounded-full bg-[var(--primary)] font-bold text-white shadow-lg shadow-[var(--primary)]/30">
                        {day}
                        {hasEvents ? (
                          <div
                            className={`absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${eventDotClassName}`}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <div className="relative flex size-8 items-center justify-center">
                        <span>{day}</span>
                        {hasEvents ? (
                          <div
                            className={`absolute bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${eventDotClassName}`}
                          />
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {isMonthLoading ? (
            <div className="pointer-events-none absolute inset-x-0 top-[5.75rem] z-10 px-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-center text-sm font-medium text-slate-500 shadow-sm backdrop-blur">
                월별 일정을 불러오는 중입니다.
              </div>
            </div>
          ) : null}

          <motion.div
            className="flex items-center justify-between px-4 pb-2 pt-6"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900">
              {month.shortLabel} {selectedDay}일 일정
            </h3>
            <span className="rounded bg-[var(--primary)]/10 px-2 py-1 text-xs font-semibold text-[var(--primary)]">
              {events.length}건
            </span>
          </motion.div>

          <div className="space-y-3 px-4">
            {events.length > 0 ? (
              events.map((event, index) => (
                <motion.article
                  key={event.eventId}
                  className="rounded-xl"
                  {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                >
                  <EventCard clubId={clubId} event={event} />
                </motion.article>
              ))
            ) : (
              <motion.div
                className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500"
                {...staggeredFadeUpMotion(2, reduceMotion)}
              >
                선택한 날짜에는 일정이 없습니다.
              </motion.div>
            )}

            {nextUpcomingEvent ? (
              <motion.div
                className="pt-4 opacity-70"
                {...staggeredFadeUpMotion(events.length + 3, reduceMotion)}
              >
                <p className="mb-3 text-xs font-bold tracking-[0.22em] text-slate-500">다음 일정</p>
                <RouterLink
                  href={`/clubs/${clubId}/schedule/${nextUpcomingEvent.eventId}`}
                  className="flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-100 p-3 transition-all hover:border-[var(--primary)]/40"
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="mb-1 text-base font-bold leading-none text-slate-900">
                      {nextUpcomingEvent.title}
                    </p>
                    <p className="text-sm font-normal text-slate-500">
                      {getEventSecondaryText(nextUpcomingEvent)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {nextUpcomingEvent.timeLabel ?? nextUpcomingEvent.dateLabel}
                    </p>
                  </div>
                </RouterLink>
              </motion.div>
            ) : null}
          </div>

          <motion.div
            className="flex items-center justify-between px-4 pb-2 pt-8"
            {...staggeredFadeUpMotion(events.length + 4, reduceMotion)}
          >
            <div>
              <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900">
                {month.shortLabel} {selectedDay}일 투표
              </h3>
              <p className="text-xs text-slate-500">선택한 날짜가 투표 기간에 포함되는 항목만 표시됩니다.</p>
            </div>
            <span className="rounded bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-500">
              {votes.length}건
            </span>
          </motion.div>

          <div className="space-y-3 px-4">
            {votes.length > 0 ? (
              votes.map((vote, index) => (
                <motion.article
                  key={vote.voteId}
                  className="rounded-xl"
                  {...staggeredFadeUpMotion(events.length + index + 4, reduceMotion)}
                >
                  <VoteCard clubId={clubId} vote={vote} />
                </motion.article>
              ))
            ) : (
              <motion.div
                className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500"
                {...staggeredFadeUpMotion(events.length + 4, reduceMotion)}
              >
                선택한 날짜에 해당하는 투표가 없습니다.
              </motion.div>
            )}
          </div>
        </div>

        {payload.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <ClubBottomNav clubId={clubId} isAdmin={payload.admin} />

        <AnimatePresence>
          {showEventCreateModal ? (
            <RouteModal onDismiss={() => setShowEventCreateModal(false)} dismissOnBackdrop={false}>
              <ClubScheduleEditorClient
                clubId={clubId}
                clubName={payload.clubName}
                presentation="modal"
                initialEventDate={selectedDateValue}
                onRequestClose={() => setShowEventCreateModal(false)}
              />
            </RouteModal>
          ) : null}
          {showVoteCreateModal ? (
            <RouteModal onDismiss={() => setShowVoteCreateModal(false)} dismissOnBackdrop={false}>
              <ClubScheduleVoteEditorClient
                clubId={clubId}
                clubName={payload.clubName}
                presentation="modal"
                onRequestClose={() => setShowVoteCreateModal(false)}
              />
            </RouteModal>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
