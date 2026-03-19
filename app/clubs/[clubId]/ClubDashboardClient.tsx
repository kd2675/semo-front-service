"use client";

import { motion, useReducedMotion } from "motion/react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import type { ClubDashboard } from "@/app/lib/mock-clubs";

type ClubDashboardClientProps = {
  club: ClubDashboard;
};

const ACTIVITY_TONE_CLASS = {
  primary: "bg-[var(--primary)]",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
} as const;

function AdminWidgetControls() {
  return (
    <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <div className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <span className="material-symbols-outlined text-lg">drag_indicator</span>
      </div>
      <button
        type="button"
        className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:text-rose-500"
        aria-label="위젯 제거"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

export function ClubDashboardClient({ club }: ClubDashboardClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const isAdmin = club.isAdmin;

  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative flex min-h-full w-full flex-col">
        <ClubPageHeader
          title={club.name}
          subtitle={isAdmin ? "운영자 모드" : "모임 홈"}
          icon="home"
          rightSlot={
            isAdmin ? (
              <button
                type="button"
                className="rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
              >
                편집
              </button>
            ) : null
          }
        />

        <main className="semo-nav-bottom-space flex-1 space-y-6 p-4 md:p-6">
          <motion.section {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-200 shadow-sm">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${club.coverImageUrl}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-end gap-4">
                <div className="size-20 overflow-hidden rounded-xl border-4 border-white bg-white shadow-lg">
                  <div className="flex h-full w-full items-center justify-center bg-[var(--primary)] text-3xl font-bold text-white">
                    {club.shortCode}
                  </div>
                </div>
                {isAdmin ? (
                  <div className="pb-1">
                    <span className="inline-flex items-center rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-semibold text-white">
                      Admin View
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <motion.article
              className={`relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 ${
                isAdmin ? "group" : ""
              }`}
              {...staggeredFadeUpMotion(1, reduceMotion)}
            >
              {isAdmin ? <AdminWidgetControls /> : null}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Next Match</h3>
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Upcoming</span>
              </div>

              <div className="flex flex-col gap-6 md:flex-row">
                <div
                  className="h-32 w-full shrink-0 rounded-lg bg-cover bg-center shadow-inner md:w-48"
                  style={{ backgroundImage: `url('${club.nextMatchImageUrl}')` }}
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-[var(--primary)]">Vs. {club.nextMatch.opponent}</h4>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <p className="text-sm font-medium">{club.nextMatch.dateLabel}</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <p className="text-sm font-medium">{club.nextMatch.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      className="flex-1 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white transition-all hover:bg-[var(--primary)]/90"
                    >
                      Attend
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold transition-all hover:bg-slate-50"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>

            <motion.article
              className={`relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${
                isAdmin ? "group" : ""
              }`}
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              {isAdmin ? <AdminWidgetControls /> : null}
              <h3 className="mb-4 text-lg font-bold">Recent Activity</h3>
              <div className="space-y-4">
                {club.recentActivities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="relative flex shrink-0 flex-col items-center">
                      <div className={`mt-1.5 size-2 rounded-full ${ACTIVITY_TONE_CLASS[activity.tone]}`} />
                      {index < club.recentActivities.length - 1 ? (
                        <div className="mt-1 h-full w-px bg-slate-200" />
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{activity.title}</p>
                      <p className="text-xs text-slate-500">{activity.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.article>

            <motion.article
              className={`relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${
                isAdmin ? "group" : ""
              }`}
              {...staggeredFadeUpMotion(3, reduceMotion)}
            >
              {isAdmin ? <AdminWidgetControls /> : null}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold">Top Rankings</h3>
                <span className="material-symbols-outlined text-[var(--primary)]">leaderboard</span>
              </div>
              <div className="space-y-3">
                {club.topRankings.map((ranking) => (
                  <div
                    key={ranking.rank}
                    className={`flex items-center justify-between rounded-lg p-2 ${
                      ranking.rank === 1 ? "bg-slate-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold ${
                          ranking.rank === 1 ? "text-[var(--primary)]" : "text-slate-400"
                        }`}
                      >
                        #{ranking.rank}
                      </span>
                      <span className="text-sm font-medium">{ranking.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{ranking.points}</span>
                  </div>
                ))}
              </div>
            </motion.article>

            <motion.article
              className={`relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${
                isAdmin ? "group" : ""
              }`}
              {...staggeredFadeUpMotion(4, reduceMotion)}
            >
              {isAdmin ? <AdminWidgetControls /> : null}
              <h3 className="mb-4 text-lg font-bold">Club Dues</h3>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="text-xl font-bold text-emerald-500">{club.dues.status}</p>
                </div>
                <div className="flex size-12 items-center justify-center rounded-full border-4 border-emerald-500/20 border-t-emerald-500">
                  <span className="material-symbols-outlined text-emerald-500">check</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{club.dues.period}</span>
                  <span className="font-bold">{club.dues.amount}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-full bg-[var(--primary)]" />
                </div>
              </div>
            </motion.article>

            <motion.article
              className={`relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${
                isAdmin ? "group" : ""
              }`}
              {...staggeredFadeUpMotion(5, reduceMotion)}
            >
              {isAdmin ? <AdminWidgetControls /> : null}
              <h3 className="mb-4 text-lg font-bold">My Attendance</h3>
              <div className="flex h-24 items-end justify-between gap-1">
                {club.attendance.bars.map((height, index) => (
                  <div
                    key={`${club.id}-attendance-${index + 1}`}
                    className={`w-full rounded-t-sm ${
                      index === club.attendance.bars.length - 1
                        ? "bg-[var(--primary)]"
                        : index === club.attendance.bars.length - 2
                          ? "bg-[var(--primary)]/60"
                          : "bg-[var(--primary)]/20"
                    }`}
                    style={{ height: `${height}%` }}
                    title={`Week ${index + 1}`}
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-between">
                <p className="text-xs text-slate-500">Last 5 weeks</p>
                <p className="text-xs font-bold text-[var(--primary)]">{club.attendance.rateLabel}</p>
              </div>
            </motion.article>

            {isAdmin ? (
              <motion.article
                className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-black/[0.02] text-slate-400 transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--primary)]/60"
                {...staggeredFadeUpMotion(6, reduceMotion)}
              >
                <span className="material-symbols-outlined text-3xl">add_circle</span>
                <p className="text-xs font-bold uppercase tracking-widest">Add Widget</p>
              </motion.article>
            ) : null}
          </section>
        </main>

        {isAdmin ? <ClubModeSwitchFab clubId={club.id} mode="user" /> : null}

      </div>
    </div>
  );
}
