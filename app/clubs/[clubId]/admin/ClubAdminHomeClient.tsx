"use client";

import { Public_Sans } from "next/font/google";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type AdminSummaryMetric = {
  id: string;
  label: string;
  value: string;
  accent?: "primary" | "orange" | "default";
  detail: string;
  detailIcon: string;
  detailTone?: "green" | "orange" | "slate";
};

type AdminActionItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  href?: string;
};

type AdminActivityItem = {
  id: string;
  actor: string;
  action: string;
  target: string;
  timeAgo: string;
  avatarLabel: string;
};

type ClubAdminHomeClientProps = {
  clubName: string;
  metrics: AdminSummaryMetric[];
  actions: AdminActionItem[];
  activities: AdminActivityItem[];
};

const DETAIL_TONE_CLASS = {
  green: "text-emerald-500",
  orange: "text-orange-400",
  slate: "text-slate-400",
} as const;

export function ClubAdminHomeClient({
  clubName,
  metrics,
  actions,
  activities,
}: ClubAdminHomeClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <div
      className={`${publicSans.className} min-h-screen bg-[#f8f6f6] text-slate-900`}
      style={
        {
          "--primary": "#ec5b13",
          "--background-light": "#f8f6f6",
        } as CSSProperties
      }
    >
      <div className="min-h-screen bg-[#f8f6f6]">
        <ClubPageHeader
          title="관리자"
          subtitle={clubName}
          icon="admin_panel_settings"
          theme="admin"
          containerClassName="max-w-5xl"
        />

        <main className="semo-nav-bottom-space mx-auto w-full max-w-5xl space-y-6 px-4 pt-4">
          <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {metrics.map((metric, index) => (
              <motion.article
                key={metric.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                {...staggeredFadeUpMotion(index, reduceMotion)}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{metric.label}</p>
                <h3
                  className={`mt-1 text-2xl font-bold ${
                    metric.accent === "primary"
                      ? "text-[var(--primary)]"
                      : metric.accent === "orange"
                        ? "text-orange-500"
                        : "text-slate-900"
                  }`}
                >
                  {metric.value}
                </h3>
                <p
                  className={`mt-1 flex items-center gap-1 text-[10px] ${
                    DETAIL_TONE_CLASS[metric.detailTone ?? "slate"]
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">{metric.detailIcon}</span>
                  {metric.detail}
                </p>
              </motion.article>
            ))}
          </section>

          <motion.section {...staggeredFadeUpMotion(4, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]">dashboard</span>
              <h2 className="text-lg font-bold">대시보드 개요</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {actions.map((action, index) => (
                <motion.article
                  key={action.id}
                  className="rounded-xl"
                  {...staggeredFadeUpMotion(index + 5, reduceMotion)}
                >
                  {action.href ? (
                    <RouterLink
                      href={action.href}
                      className="group flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[var(--primary)]/50"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                        <span className="material-symbols-outlined text-2xl">{action.icon}</span>
                      </div>
                      <div className="flex flex-col justify-center gap-1">
                        <h3 className="text-base font-bold leading-tight">{action.title}</h3>
                        <p className="text-sm leading-normal text-slate-500">{action.description}</p>
                      </div>
                    </RouterLink>
                  ) : (
                    <div className="group flex cursor-pointer gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[var(--primary)]/50">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                        <span className="material-symbols-outlined text-2xl">{action.icon}</span>
                      </div>
                      <div className="flex flex-col justify-center gap-1">
                        <h3 className="text-base font-bold leading-tight">{action.title}</h3>
                        <p className="text-sm leading-normal text-slate-500">{action.description}</p>
                      </div>
                    </div>
                  )}
                </motion.article>
              ))}
            </div>
          </motion.section>

          <motion.section {...staggeredFadeUpMotion(9, reduceMotion)}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--primary)]">history</span>
                <h2 className="text-lg font-bold">최근 활동</h2>
              </div>
              <button type="button" className="text-xs font-bold text-[var(--primary)] hover:underline">
                전체 로그 보기
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {activities.map((activity, index) => (
                <motion.article
                  key={activity.id}
                  className={`flex gap-3 p-4 ${index > 0 ? "border-t border-slate-100" : ""}`}
                  {...staggeredFadeUpMotion(index + 10, reduceMotion)}
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-[var(--primary)]/12 text-xs font-bold text-[var(--primary)]">
                    {activity.avatarLabel}
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-bold">{activity.actor}</span>{" "}
                      {activity.action}{" "}
                      <span className="font-medium text-[var(--primary)]">{activity.target}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{activity.timeAgo}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
