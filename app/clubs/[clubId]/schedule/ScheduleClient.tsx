"use client";

import { startTransition, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import {
  ClubNoticeDetailModal,
  ClubPollDetailModal,
  ClubScheduleEventDetailModal,
} from "@/app/components/ClubDetailModals";
import { RouteModal } from "@/app/components/RouteModal";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type {
  ClubCalendarFeedItem,
  ClubNoticeListItem,
  ClubScheduleEventSummary,
  ClubScheduleResponse,
  ClubScheduleVoteSummary,
} from "@/app/lib/clubs";
import { deleteClubScheduleEvent, deleteClubScheduleVote } from "@/app/lib/clubs";
import { ClubScheduleEditorClient } from "./ClubScheduleEditorClient";
import { ClubScheduleVoteEditorClient } from "./ClubScheduleVoteEditorClient";
import { ScheduleActionConfirmModal } from "./ScheduleActionConfirmModal";
import { ScheduleManageCard } from "./ScheduleManageCard";

type ScheduleClientProps = {
  clubId: string;
  payload: ClubScheduleResponse;
  activeYear: number;
  activeMonth: number;
  isMonthLoading: boolean;
  onChangeMonth: (year: number, month: number) => void;
  onReloadMonth: () => void;
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
      sortValue: string;
      notice: ClubNoticeListItem;
    }
  | {
      type: "event";
      key: string;
      sortValue: string;
      event: ClubScheduleEventSummary;
    }
  | {
      type: "vote";
      key: string;
      sortValue: string;
      vote: ClubScheduleVoteSummary;
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
  event,
  manageable,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
}: {
  event: ClubScheduleEventSummary;
  manageable: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const visual = getEventVisual(event);

  return (
    <ScheduleManageCard
      label={event.title}
      manageable={manageable}
      open={open}
      onOpenChange={onOpenChange}
      onOpen={onOpen}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 pr-7 shadow-sm transition-all hover:border-[var(--primary)]/50">
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
      </div>
    </ScheduleManageCard>
  );
}

function NoticeCard({
  notice,
  open,
  onOpenChange,
  onOpen,
}: {
  notice: ClubNoticeListItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
}) {
  return (
    <ScheduleManageCard
      label={notice.title}
      manageable={false}
      open={open}
      onOpenChange={onOpenChange}
      onOpen={onOpen}
      onEdit={() => {}}
      onDelete={() => {}}
    >
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 pr-7 shadow-sm transition-all hover:border-sky-500/50">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
          <span className="material-symbols-outlined">campaign</span>
        </div>
        <div className="flex flex-1 flex-col justify-center">
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
    </ScheduleManageCard>
  );
}

function VoteCard({
  vote,
  manageable,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
}: {
  vote: ClubScheduleVoteSummary;
  manageable: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <ScheduleManageCard
      label={vote.title}
      manageable={manageable}
      open={open}
      onOpenChange={onOpenChange}
      onOpen={onOpen}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 pr-7 shadow-sm transition-all hover:border-amber-500/50">
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
            {vote.voteStatus === "CLOSED"
              ? "CLOSED"
              : vote.voteStatus === "WAITING"
                ? "WAITING"
                : vote.mySelectedOptionId
                  ? "VOTED"
                  : "PENDING"}
          </p>
        </div>
      </div>
    </ScheduleManageCard>
  );
}

export function ScheduleClient({
  clubId,
  payload,
  activeYear,
  activeMonth,
  isMonthLoading,
  onChangeMonth,
  onReloadMonth,
}: ScheduleClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const canManageSchedule = false;
  const month = useMemo(() => buildCalendarMonth(activeYear, activeMonth, payload.items), [activeMonth, activeYear, payload.items]);
  const [selectedDay, setSelectedDay] = useState(month.defaultSelectedDay);
  const [detailNoticeId, setDetailNoticeId] = useState<string | null>(null);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [detailVoteId, setDetailVoteId] = useState<string | null>(null);
  const [editingVoteId, setEditingVoteId] = useState<string | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<ClubScheduleEventSummary | null>(null);
  const [deleteVoteTarget, setDeleteVoteTarget] = useState<ClubScheduleVoteSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);

  const dayItems = month.itemsByDay[selectedDay] ?? [];
  const selectedDateValue = getDateValue(month.year, month.month, selectedDay);
  const selectedItems: SelectedScheduleItem[] = dayItems
    .map((item) => {
      if (item.contentType === "NOTICE" && item.notice) {
        return {
          type: "notice" as const,
          key: `notice-${item.notice.noticeId}`,
          sortValue: item.notice.scheduleAt ?? `${selectedDateValue}T00:00`,
          notice: item.notice,
        };
      }
      if (item.contentType === "SCHEDULE_EVENT" && item.event) {
        return {
          type: "event" as const,
          key: `event-${item.event.eventId}`,
          sortValue: `${item.event.startDate}T${item.event.timeLabel ?? "00:00"}`,
          event: item.event,
        };
      }
      if (item.contentType === "SCHEDULE_VOTE" && item.vote) {
        return {
          type: "vote" as const,
          key: `vote-${item.vote.voteId}`,
          sortValue: `${item.vote.voteStartDate}T${item.vote.voteTimeLabel ?? "00:00"}`,
          vote: item.vote,
        };
      }
      return null;
    })
    .filter((item): item is SelectedScheduleItem => item !== null)
    .sort((left, right) => left.sortValue.localeCompare(right.sortValue));
  const maxEventCount = Math.max(0, ...Object.values(month.scheduleItemCountByDay));

  const handleMoveMonth = (direction: "prev" | "next") => {
    const next = shiftMonth(activeYear, activeMonth, direction === "prev" ? -1 : 1);
    onChangeMonth(next.year, next.month);
  };

  const handleSelectDay = (day: number) => {
    startTransition(() => {
      setSelectedDay(day);
    });
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) {
      return;
    }
    setDeleting(true);
    const result = await deleteClubScheduleEvent(clubId, deleteEventTarget.eventId);
    setDeleting(false);
    if (!result.ok) {
      return;
    }
    setDeleteEventTarget(null);
    setActiveActionKey(null);
    onReloadMonth();
  };

  const handleDeleteVote = async () => {
    if (!deleteVoteTarget) {
      return;
    }
    setDeleting(true);
    const result = await deleteClubScheduleVote(clubId, deleteVoteTarget.voteId);
    setDeleting(false);
    if (!result.ok) {
      return;
    }
    setDeleteVoteTarget(null);
    setActiveActionKey(null);
    onReloadMonth();
  };

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col bg-[var(--background-light)]">
        <ClubPageHeader title="일정" subtitle={payload.clubName} />

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
                const eventCount = month.scheduleItemCountByDay[day] ?? 0;
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
                      manageable={canManageSchedule}
                      open={activeActionKey === item.key}
                      onOpenChange={(nextOpen) => {
                        setActiveActionKey(nextOpen ? item.key : null);
                      }}
                      onOpen={() => {
                        setActiveActionKey(null);
                        setDetailEventId(String(item.event.eventId));
                      }}
                      onEdit={() => {
                        setActiveActionKey(null);
                        setEditingEventId(String(item.event.eventId));
                      }}
                      onDelete={() => {
                        setActiveActionKey(null);
                        setDeleteEventTarget(item.event);
                      }}
                    />
                  ) : item.type === "vote" ? (
                    <VoteCard
                      vote={item.vote}
                      manageable={canManageSchedule}
                      open={activeActionKey === item.key}
                      onOpenChange={(nextOpen) => {
                        setActiveActionKey(nextOpen ? item.key : null);
                      }}
                      onOpen={() => {
                        setActiveActionKey(null);
                        setDetailVoteId(String(item.vote.voteId));
                      }}
                      onEdit={() => {
                        setActiveActionKey(null);
                        setEditingVoteId(String(item.vote.voteId));
                      }}
                      onDelete={() => {
                        setActiveActionKey(null);
                        setDeleteVoteTarget(item.vote);
                      }}
                    />
                  ) : (
                    <NoticeCard
                      notice={item.notice}
                      open={false}
                      onOpenChange={() => {}}
                      onOpen={() => {
                        setActiveActionKey(null);
                        setDetailNoticeId(String(item.notice.noticeId));
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
          {editingEventId ? (
            <RouteModal onDismiss={() => setEditingEventId(null)} dismissOnBackdrop={false}>
              <ClubScheduleEditorClient
                clubId={clubId}
                eventId={editingEventId}
                clubName={payload.clubName}
                presentation="modal"
                onRequestClose={() => setEditingEventId(null)}
                onSaved={(savedEventId) => {
                  setEditingEventId(null);
                  onReloadMonth();
                  setDetailEventId(String(savedEventId));
                }}
                onDeleted={() => {
                  setEditingEventId(null);
                  onReloadMonth();
                }}
              />
            </RouteModal>
          ) : null}
          {detailVoteId ? (
            <ClubPollDetailModal
              clubId={clubId}
              voteId={detailVoteId}
              onRequestClose={() => setDetailVoteId(null)}
            />
          ) : null}
          {editingVoteId ? (
            <RouteModal onDismiss={() => setEditingVoteId(null)} dismissOnBackdrop={false}>
              <ClubScheduleVoteEditorClient
                clubId={clubId}
                voteId={editingVoteId}
                clubName={payload.clubName}
                presentation="modal"
                basePath={`/clubs/${clubId}/more/polls`}
                onRequestClose={() => setEditingVoteId(null)}
                onSaved={(savedVoteId) => {
                  setEditingVoteId(null);
                  onReloadMonth();
                  setDetailVoteId(String(savedVoteId));
                }}
              />
            </RouteModal>
          ) : null}
          {deleteEventTarget ? (
            <ScheduleActionConfirmModal
              title="일정을 삭제할까요?"
              description={`"${deleteEventTarget.title}" 일정은 삭제 후 복구할 수 없습니다.`}
              confirmLabel="일정 삭제"
              busyLabel="삭제 중..."
              busy={deleting}
              onCancel={() => {
                if (!deleting) {
                  setDeleteEventTarget(null);
                }
              }}
              onConfirm={handleDeleteEvent}
            />
          ) : null}
          {deleteVoteTarget ? (
            <ScheduleActionConfirmModal
              title="투표를 삭제할까요?"
              description={`"${deleteVoteTarget.title}" 투표는 삭제 후 복구할 수 없습니다.`}
              confirmLabel="투표 삭제"
              busyLabel="삭제 중..."
              busy={deleting}
              onCancel={() => {
                if (!deleting) {
                  setDeleteVoteTarget(null);
                }
              }}
              onConfirm={handleDeleteVote}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
