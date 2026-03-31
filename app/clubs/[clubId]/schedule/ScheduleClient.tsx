"use client";

import { startTransition, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import {
  ClubNoticeDetailModal,
  ClubPollDetailModal,
  ClubScheduleEventDetailModal,
  ClubTournamentDetailModal,
} from "@/app/components/ClubDetailModals";
import { getShareTargetBadges } from "@/app/lib/content-badge";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import {
  getTournamentFeeLabel,
  getTournamentFormatLabel,
  getTournamentStatusBadgeClassName,
  getTournamentStatusLabel,
} from "@/app/lib/tournament";
import { getVoteLifecycleLabel } from "@/app/lib/vote-status";
import type {
  ClubCalendarFeedItem,
  ClubNoticeListItem,
  ClubScheduleEventSummary,
  ClubScheduleResponse,
  ClubScheduleVoteSummary,
  TournamentSummary,
} from "@/app/lib/clubs";

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
  itemsByDay: Record<number, ClubCalendarFeedItem[]>;
  scheduleItemCountByDay: Record<number, number>;
};

type SelectedScheduleItem =
  | {
      type: "notice";
      key: string;
      calendarItemId: number;
      sortValue: string;
      notice: ClubNoticeListItem;
    }
  | {
      type: "event";
      key: string;
      calendarItemId: number;
      sortValue: string;
      event: ClubScheduleEventSummary;
    }
  | {
      type: "vote";
      key: string;
      calendarItemId: number;
      sortValue: string;
      vote: ClubScheduleVoteSummary;
    }
  | {
      type: "tournament";
      key: string;
      calendarItemId: number;
      sortValue: string;
      tournament: TournamentSummary;
    };

type SelectedDayState = {
  monthId: string;
  day: number;
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

function getDatePart(value: string | null | undefined) {
  return value ? value.slice(0, 10) : null;
}

function forEachMonthDayInRange(
  year: number,
  month: number,
  startDateValue: string,
  endDateValue: string,
  callback: (day: number) => void,
) {
  const startDate = new Date(`${startDateValue}T00:00:00`);
  const endDate = new Date(`${endDateValue}T00:00:00`);
  for (const cursor = new Date(startDate); cursor <= endDate; cursor.setDate(cursor.getDate() + 1)) {
    if (cursor.getFullYear() !== year || cursor.getMonth() + 1 !== month) {
      continue;
    }
    callback(cursor.getDate());
  }
}

function buildCalendarMonth(
  year: number,
  month: number,
  items: ClubCalendarFeedItem[],
): CalendarMonth {
  const today = new Date();
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlankDays = firstDay.getDay();
  const id = getMonthId(year, month);
  const itemsByDay: Record<number, ClubCalendarFeedItem[]> = {};
  const scheduleItemCountByDay: Record<number, number> = {};

  items.forEach((item) => {
    let startDateValue: string | null = null;
    let endDateValue: string | null = null;

    if (item.contentType === "NOTICE" && item.notice) {
      startDateValue = getDatePart(item.notice.scheduleAt);
      endDateValue = getDatePart(item.notice.scheduleEndAt) ?? startDateValue;
    } else if (item.contentType === "SCHEDULE_EVENT" && item.event) {
      startDateValue = item.event.startDate;
      endDateValue = item.event.endDate ?? item.event.startDate;
    } else if (item.contentType === "SCHEDULE_VOTE" && item.vote) {
      startDateValue = item.vote.voteStartDate;
      endDateValue = item.vote.voteEndDate;
    } else if (item.contentType === "TOURNAMENT" && item.tournament) {
      startDateValue = item.tournament.startDate;
      endDateValue = item.tournament.endDate;
    }

    if (!startDateValue || !endDateValue) {
      return;
    }

    forEachMonthDayInRange(year, month, startDateValue, endDateValue, (day) => {
      itemsByDay[day] = [...(itemsByDay[day] ?? []), item];
      scheduleItemCountByDay[day] = (scheduleItemCountByDay[day] ?? 0) + 1;
    });
  });

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
    itemsByDay,
    scheduleItemCountByDay,
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

function formatNoticeTimeValue(value: string | null | undefined) {
  if (!value || value.length < 16) {
    return null;
  }
  return value.slice(11, 16);
}

function getNoticeSecondaryText(notice: ClubNoticeListItem) {
  const parts = [notice.locationLabel, notice.summary].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "세부 안내 없음";
}

function getNoticeTimeLabel(notice: ClubNoticeListItem) {
  if (!notice.scheduleTimeEnabled) {
    return "공지";
  }
  const startTime = formatNoticeTimeValue(notice.scheduleAt);
  const endTime = formatNoticeTimeValue(notice.scheduleEndAt);
  if (!startTime && !endTime) {
    return "공지";
  }
  if (!endTime || endTime === startTime) {
    return startTime ?? "공지";
  }
  return `${startTime} - ${endTime}`;
}

function getNoticeStatusLabel(notice: ClubNoticeListItem) {
  if (notice.pinned) {
    return "PINNED";
  }
  return "NOTICE";
}

function renderCalendarBadges(badges: Array<{ label: string; className: string }>) {
  return badges.map((badge) => (
    <span
      key={badge.label}
      className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${badge.className}`}
    >
      {badge.label}
    </span>
  ));
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

function getWeekendTextClassName(weekdayIndex: number) {
  if (weekdayIndex === 0) {
    return "text-rose-500";
  }
  if (weekdayIndex === 6) {
    return "text-blue-500";
  }
  return "text-slate-400";
}

function EventCard({
  event,
  onOpen,
}: {
  event: ClubScheduleEventSummary;
  onOpen: () => void;
}) {
  const visual = getEventVisual(event);
  const shareBadges = getShareTargetBadges({
    postedToBoard: event.postedToBoard,
    postedToCalendar: event.postedToCalendar,
  });

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${event.title} 자세히 보기`}
      className="block w-full text-left"
    >
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-[var(--primary)]/50 hover:bg-slate-50">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${visual.iconSurfaceClassName} ${visual.iconClassName}`}
        >
          <span className="material-symbols-outlined">{visual.icon}</span>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-600">
              일정
            </span>
            {event.pinned ? (
              <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-600">
                고정
              </span>
            ) : null}
            {renderCalendarBadges(shareBadges)}
          </div>
          <p className="mb-1 text-base font-bold leading-none text-slate-900">{event.title}</p>
          <p className="text-sm font-normal text-slate-500">{getEventSecondaryText(event)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-slate-900">{event.timeLabel ?? "종일"}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {getEventStatusLabel(event)}
          </p>
        </div>
      </div>
    </button>
  );
}

function NoticeCard({
  notice,
  onOpen,
}: {
  notice: ClubNoticeListItem;
  onOpen: () => void;
}) {
  const shareBadges = getShareTargetBadges({
    postedToBoard: notice.postedToBoard,
    postedToCalendar: notice.postedToCalendar,
  });

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${notice.title} 자세히 보기`}
      className="block w-full text-left"
    >
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-sky-500/50 hover:bg-slate-50">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
          <span className="material-symbols-outlined">campaign</span>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold uppercase text-blue-600">
              공지
            </span>
            {notice.pinned ? (
              <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-600">
                고정
              </span>
            ) : null}
            {renderCalendarBadges(shareBadges)}
          </div>
          <p className="mb-1 text-base font-bold leading-none text-slate-900">{notice.title}</p>
          <p className="line-clamp-2 text-sm font-normal text-slate-500">{getNoticeSecondaryText(notice)}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-slate-900">{getNoticeTimeLabel(notice)}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {getNoticeStatusLabel(notice)}
          </p>
        </div>
      </div>
    </button>
  );
}

function VoteCard({
  vote,
  onOpen,
}: {
  vote: ClubScheduleVoteSummary;
  onOpen: () => void;
}) {
  const shareBadges = getShareTargetBadges({
    postedToBoard: vote.postedToBoard,
    postedToCalendar: vote.postedToCalendar,
  });

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${vote.title} 자세히 보기`}
      className="block w-full text-left"
    >
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-amber-500/50 hover:bg-slate-50">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <span className="material-symbols-outlined">poll</span>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-bold uppercase text-violet-600">
              투표
            </span>
            {vote.pinned ? (
              <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-600">
                고정
              </span>
            ) : null}
            {renderCalendarBadges(shareBadges)}
          </div>
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
            {getVoteLifecycleLabel(vote.voteStatus)}
          </p>
        </div>
      </div>
    </button>
  );
}

function TournamentCard({
  tournament,
  onOpen,
}: {
  tournament: TournamentSummary;
  onOpen: () => void;
}) {
  const shareBadges = getShareTargetBadges({
    postedToBoard: tournament.postedToBoard,
    postedToCalendar: tournament.postedToCalendar,
  });

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${tournament.title} 자세히 보기`}
      className="block w-full text-left"
    >
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-emerald-500/50 hover:bg-slate-50">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
          <span className="material-symbols-outlined">emoji_events</span>
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-700">
              대회
            </span>
            <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${getTournamentStatusBadgeClassName(tournament.tournamentStatus)}`}>
              {getTournamentStatusLabel(tournament.tournamentStatus)}
            </span>
            {tournament.pinned ? (
              <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-600">
                고정
              </span>
            ) : null}
            {renderCalendarBadges(shareBadges)}
          </div>
          <p className="mb-1 text-base font-bold leading-none text-slate-900">{tournament.title}</p>
          <p className="line-clamp-2 text-sm font-normal text-slate-500">
            {tournament.summaryText
              ?? [
                getTournamentFormatLabel(tournament.matchFormat),
                tournament.locationLabel,
              ].filter(Boolean).join(" • ")}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-slate-900">{tournament.tournamentPeriodLabel}</p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            {getTournamentFeeLabel(tournament)}
          </p>
        </div>
      </div>
    </button>
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
  const today = new Date();
  const month = useMemo(() => buildCalendarMonth(activeYear, activeMonth, payload.items), [activeMonth, activeYear, payload.items]);
  const [selectedDayState, setSelectedDayState] = useState<SelectedDayState>({
    monthId: month.id,
    day: month.defaultSelectedDay,
  });
  const selectedDay =
    selectedDayState.monthId === month.id ? selectedDayState.day : month.defaultSelectedDay;
  const [detailNoticeId, setDetailNoticeId] = useState<string | null>(null);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [detailVoteId, setDetailVoteId] = useState<string | null>(null);
  const [detailTournamentId, setDetailTournamentId] = useState<string | null>(null);

  const dayItems = month.itemsByDay[selectedDay] ?? [];
  const selectedDateValue = getDateValue(month.year, month.month, selectedDay);
  const selectedItems = dayItems
    .flatMap<SelectedScheduleItem>((item) => {
      if (item.contentType === "NOTICE" && item.notice) {
        return [{
          type: "notice" as const,
          key: `notice-${item.notice.noticeId}`,
          calendarItemId: item.calendarItemId,
          sortValue: item.notice.scheduleAt ?? `${selectedDateValue}T00:00`,
          notice: item.notice,
        }];
      }
      if (item.contentType === "SCHEDULE_EVENT" && item.event) {
        return [{
          type: "event" as const,
          key: `event-${item.event.eventId}`,
          calendarItemId: item.calendarItemId,
          sortValue: `${item.event.startDate}T${item.event.timeLabel ?? "00:00"}`,
          event: item.event,
        }];
      }
      if (item.contentType === "SCHEDULE_VOTE" && item.vote) {
        return [{
          type: "vote" as const,
          key: `vote-${item.vote.voteId}`,
          calendarItemId: item.calendarItemId,
          sortValue: `${item.vote.voteStartDate}T${item.vote.voteTimeLabel ?? "00:00"}`,
          vote: item.vote,
        }];
      }
      if (item.contentType === "TOURNAMENT" && item.tournament) {
        return [{
          type: "tournament" as const,
          key: `tournament-${item.tournament.tournamentRecordId}`,
          calendarItemId: item.calendarItemId,
          sortValue: `${item.tournament.startDate}T00:00`,
          tournament: item.tournament,
        }];
      }
      return [];
    })
    .sort((left, right) => left.sortValue.localeCompare(right.sortValue));
  const maxEventCount = Math.max(0, ...Object.values(month.scheduleItemCountByDay));

  const openCalendarItemDetail = (item: SelectedScheduleItem) => {
    if (item.type === "notice") {
      setDetailNoticeId(String(item.notice.noticeId));
      return;
    }
    if (item.type === "event") {
      setDetailEventId(String(item.event.eventId));
      return;
    }
    if (item.type === "vote") {
      setDetailVoteId(String(item.vote.voteId));
      return;
    }
    setDetailTournamentId(String(item.tournament.tournamentRecordId));
  };

  const handleMoveMonth = (direction: "prev" | "next") => {
    const next = shiftMonth(activeYear, activeMonth, direction === "prev" ? -1 : 1);
    onChangeMonth(next.year, next.month);
  };

  const handleSelectDay = (day: number) => {
    startTransition(() => {
      setSelectedDayState({ monthId: month.id, day });
    });
  };

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col bg-[var(--background-light)]">
        <ClubPageHeader title="캘린더" subtitle={payload.clubName} />

        <main className="semo-nav-bottom-space relative flex-1">
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
                <p
                  key={`${month.id}-weekday-${index}`}
                  className={`py-2 text-xs font-bold ${getWeekendTextClassName(index)}`}
                >
                  {label}
                </p>
              ))}

              {Array.from({ length: month.leadingBlankDays }, (_, index) => (
                <div key={`${month.id}-blank-${index + 1}`} className="h-10" />
              ))}

              {Array.from({ length: month.daysInMonth }, (_, index) => {
                const day = index + 1;
                const isActive = day === selectedDay;
                const weekdayIndex = new Date(month.year, month.month - 1, day).getDay();
                const isToday =
                  month.year === today.getFullYear()
                  && month.month === today.getMonth() + 1
                  && day === today.getDate();
                const eventCount = month.scheduleItemCountByDay[day] ?? 0;
                const hasEvents = eventCount > 0;
                const eventDotClassName = getEventDotClassName(eventCount, maxEventCount, isActive);
                const weekendTextClassName = weekdayIndex === 0
                  ? "text-rose-500"
                  : weekdayIndex === 6
                    ? "text-blue-500"
                    : "text-slate-700";
                const dayTextClassName = isToday ? "text-emerald-600" : weekendTextClassName;

                return (
                  <button
                    key={`${month.id}-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className="flex h-10 w-full items-center justify-center text-sm font-medium"
                  >
                    {isActive ? (
                      <div className="relative flex size-8 items-center justify-center rounded-full bg-[var(--primary)] font-bold text-white shadow-lg shadow-[var(--primary)]/30">
                        <span className={isToday ? "text-emerald-200" : ""}>{day}</span>
                        {hasEvents ? (
                          <div
                            className={`absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full ${eventDotClassName}`}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <div className="relative flex size-8 items-center justify-center rounded-full">
                        <span className={`font-medium ${dayTextClassName}`}>
                          {day}
                        </span>
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

            <div className="mt-3 flex justify-end">
              <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-medium text-slate-500">
                <span>적음</span>
                <span className="size-1.5 rounded-full bg-white ring-1 ring-slate-300" />
                <span className="size-1.5 rounded-full bg-yellow-400" />
                <span className="size-1.5 rounded-full bg-orange-500" />
                <span className="size-1.5 rounded-full bg-red-500" />
                <span>많음</span>
              </div>
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
              {selectedItems.length}건
            </span>
          </motion.div>

          <div className="space-y-3 px-4">
            {selectedItems.length > 0 ? (
              selectedItems.map((item, index) => (
                <motion.article
                  key={item.key}
                  className="rounded-xl"
                  {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                >
                  {item.type === "event" ? (
                    <EventCard
                      event={item.event}
                      onOpen={() => {
                        openCalendarItemDetail(item);
                      }}
                    />
                  ) : item.type === "vote" ? (
                    <VoteCard
                      vote={item.vote}
                      onOpen={() => {
                        openCalendarItemDetail(item);
                      }}
                    />
                  ) : item.type === "tournament" ? (
                    <TournamentCard
                      tournament={item.tournament}
                      onOpen={() => {
                        openCalendarItemDetail(item);
                      }}
                    />
                  ) : (
                    <NoticeCard
                      notice={item.notice}
                      onOpen={() => {
                        openCalendarItemDetail(item);
                      }}
                    />
                  )}
                </motion.article>
              ))
            ) : (
              <motion.div
                className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500"
                {...staggeredFadeUpMotion(2, reduceMotion)}
              >
                선택한 날짜에는 캘린더 항목이 없습니다.
              </motion.div>
            )}
          </div>
        </main>

        {payload.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <AnimatePresence>
          {detailNoticeId ? (
            <ClubNoticeDetailModal
              clubId={clubId}
              noticeId={detailNoticeId}
              onRequestClose={() => setDetailNoticeId(null)}
            />
          ) : null}
          {detailEventId ? (
            <ClubScheduleEventDetailModal
              clubId={clubId}
              eventId={detailEventId}
              onRequestClose={() => setDetailEventId(null)}
            />
          ) : null}
          {detailVoteId ? (
            <ClubPollDetailModal
              clubId={clubId}
              voteId={detailVoteId}
              onRequestClose={() => setDetailVoteId(null)}
            />
          ) : null}
          {detailTournamentId ? (
            <ClubTournamentDetailModal
              clubId={clubId}
              tournamentRecordId={detailTournamentId}
              onRequestClose={() => setDetailTournamentId(null)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
