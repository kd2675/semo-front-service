"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { RouteModal } from "@/app/components/RouteModal";
import { toDateTimeLocalString } from "@/app/lib/date-time";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type { ClubScheduleEvent, ClubScheduleMonth } from "@/app/lib/mock-clubs";
import { ClubScheduleEditorClient } from "./ClubScheduleEditorClient";

type ScheduleClientProps = {
  clubId: string;
  clubName: string;
  months: ClubScheduleMonth[];
  isAdmin?: boolean;
};

type ScheduleCreateDefaults = {
  startAt: string;
  endAt: string;
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const EVENT_TONE_CLASS: Record<ClubScheduleEvent["tone"], string> = {
  primary: "text-[var(--primary)] bg-[var(--primary)]/10",
  amber: "text-amber-500 bg-amber-500/10",
  slate: "text-slate-400 bg-slate-200",
};

export function ScheduleClient({ clubId, clubName, months, isAdmin = false }: ScheduleClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const isRealClub = !Number.isNaN(Number(clubId));
  const canManageSchedule = isAdmin && isRealClub;
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  const initialMonthIndex = Math.max(
    months.findIndex((candidate) => candidate.year === todayYear && candidate.month === todayMonth),
    0,
  );
  const resolveDefaultDay = (index: number) => {
    const targetMonth = months[index];
    if (!targetMonth) {
      return 1;
    }
    if (targetMonth.year === todayYear && targetMonth.month === todayMonth) {
      return Math.min(todayDay, targetMonth.daysInMonth);
    }
    return targetMonth.defaultSelectedDay ?? 1;
  };
  const [monthIndex, setMonthIndex] = useState(initialMonthIndex);
  const [selectedDay, setSelectedDay] = useState(resolveDefaultDay(initialMonthIndex));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<ScheduleCreateDefaults | null>(null);

  const month = months[monthIndex];
  const events = month?.eventsByDay[selectedDay] ?? [];

  if (!month) {
    return null;
  }

  const selectMonth = (direction: "prev" | "next") => {
    startTransition(() => {
      const nextIndex =
        direction === "prev"
          ? Math.max(monthIndex - 1, 0)
          : Math.min(monthIndex + 1, months.length - 1);

      setMonthIndex(nextIndex);
      setSelectedDay(resolveDefaultDay(nextIndex));
    });
  };

  const handleSelectDay = (day: number) => {
    startTransition(() => {
      setSelectedDay(day);
    });
  };

  const openCreateModal = () => {
    const now = new Date();
    const baseStartAt = new Date(
      month.year,
      month.month - 1,
      selectedDay,
      now.getHours(),
      now.getMinutes(),
      0,
      0,
    );
    const baseEndAt = new Date(baseStartAt.getTime() + 60 * 60 * 1000);
    setCreateDefaults({
      startAt: toDateTimeLocalString(baseStartAt),
      endAt: toDateTimeLocalString(baseEndAt),
    });
    setShowCreateModal(true);
  };

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-[var(--background-light)]">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <Link
            href={`/clubs/${clubId}`}
            className="flex size-10 shrink-0 items-center justify-center text-slate-900"
            aria-label={`${clubName} 홈으로 돌아가기`}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight">Club Schedule</h2>
          <div className="flex w-10 items-center justify-end">
            {canManageSchedule ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"
                aria-label="일정 추가"
              >
                <span className="material-symbols-outlined">calendar_add_on</span>
              </button>
            ) : (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] opacity-40"
                aria-label="일정 추가"
                disabled
              >
                <span className="material-symbols-outlined">calendar_add_on</span>
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-28">
          <motion.div className="bg-white p-4 shadow-sm" {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => selectMonth("prev")}
                disabled={monthIndex === 0}
                className="rounded-full p-1 text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-35"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <p className="text-base font-bold text-slate-900">{month.label}</p>
              <button
                type="button"
                onClick={() => selectMonth("next")}
                disabled={monthIndex === months.length - 1}
                className="rounded-full p-1 text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-35"
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
                const hasEvents = (month.eventsByDay[day] ?? []).length > 0;
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
                          <div className="absolute -bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white" />
                        ) : null}
                      </div>
                    ) : (
                      <div className="relative flex size-8 items-center justify-center">
                        <span>{day}</span>
                        {hasEvents ? (
                          <div className="absolute bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--primary)]/70" />
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            className="flex items-center justify-between px-4 pb-2 pt-6"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900">
              Events for {month.shortLabel} {selectedDay}
            </h3>
            <span className="rounded bg-[var(--primary)]/10 px-2 py-1 text-xs font-semibold text-[var(--primary)]">
              {events.length} Events
            </span>
          </motion.div>

          <div className="space-y-3 px-4">
            {events.map((event, index) => (
              <motion.article
                key={event.id}
                className="rounded-xl"
                {...staggeredFadeUpMotion(index + 2, reduceMotion)}
              >
                {isRealClub ? (
                  <Link
                    href={`/clubs/${clubId}/schedule/${event.id}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-[var(--primary)]/50"
                  >
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${EVENT_TONE_CLASS[event.tone]}`}
                    >
                      <span className="material-symbols-outlined">{event.icon}</span>
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="mb-1 text-base font-bold leading-none text-slate-900">{event.title}</p>
                      <p className="text-sm font-normal text-slate-500">{event.subtitle}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900">{event.startTime}</p>
                      {event.durationLabel ? (
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          {event.durationLabel}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-[var(--primary)]/50">
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${EVENT_TONE_CLASS[event.tone]}`}
                    >
                      <span className="material-symbols-outlined">{event.icon}</span>
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="mb-1 text-base font-bold leading-none text-slate-900">{event.title}</p>
                      <p className="text-sm font-normal text-slate-500">{event.subtitle}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-slate-900">{event.startTime}</p>
                      {event.durationLabel ? (
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          {event.durationLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              </motion.article>
            ))}

            {month.teaser ? (
              <motion.div
                className="pt-4 opacity-60"
                {...staggeredFadeUpMotion(events.length + 2, reduceMotion)}
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                  {month.teaser.label}
                </p>
                <div className="flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-100 p-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                    <span className="material-symbols-outlined">{month.teaser.event.icon}</span>
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="mb-1 text-base font-bold leading-none text-slate-900">{month.teaser.event.title}</p>
                    <p className="text-sm font-normal text-slate-500">{month.teaser.event.subtitle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900">{month.teaser.event.startTime}</p>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <ClubBottomNav clubId={clubId} isAdmin={isAdmin} />

        <AnimatePresence>
          {showCreateModal ? (
            <RouteModal onDismiss={() => setShowCreateModal(false)} dismissOnBackdrop={false}>
              <ClubScheduleEditorClient
                clubId={clubId}
                presentation="modal"
                initialStartAt={createDefaults?.startAt}
                initialEndAt={createDefaults?.endAt}
                onRequestClose={() => setShowCreateModal(false)}
              />
            </RouteModal>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
