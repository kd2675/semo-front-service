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
  activityId: number;
  actorDisplayName: string;
  actorAvatarLabel: string;
  subject: string;
  detail: string;
  status: "SUCCESS" | "FAIL" | string;
  errorMessage: string | null;
  createdAt: string | null;
  createdAtLabel: string | null;
};

type ClubAdminHomeClientProps = {
  clubId: string;
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

function formatRelativeTime(value: string | null, fallback: string | null) {
  if (!value) {
    return fallback ?? "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback ?? "";
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);
  if (diffMinutes < 1) {
    return "방금 전";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }
  return fallback ?? parsed.toLocaleString("ko-KR");
}

export function ClubAdminHomeClient({
  clubId,
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
          <section className={`grid grid-cols-2 gap-4 ${metrics.length > 2 ? "md:grid-cols-4" : "md:grid-cols-2"}`}>
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
              <RouterLink
                href={`/clubs/${clubId}/admin/logs`}
                className="text-xs font-bold text-[var(--primary)] hover:underline"
              >
                전체 로그 보기
              </RouterLink>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {activities.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">아직 기록된 최근 활동이 없습니다.</div>
              ) : (
                activities.map((activity, index) => (
                  <motion.article
                    key={activity.activityId}
                    className={`flex gap-3 p-4 ${index > 0 ? "border-t border-slate-100" : ""}`}
                    {...staggeredFadeUpMotion(index + 10, reduceMotion)}
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-[var(--primary)]/12 text-xs font-bold text-[var(--primary)]">
                      {activity.actorAvatarLabel}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700">
                        <span className="font-bold text-slate-900">{activity.actorDisplayName}</span>{" "}
                        {activity.detail}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                          {activity.subject}
                        </span>
                        <span className="text-slate-400">
                          {formatRelativeTime(activity.createdAt, activity.createdAtLabel)}
                        </span>
                        {activity.status === "FAIL" ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-600">
                            실패
                          </span>
                        ) : null}
                      </div>
                      {activity.status === "FAIL" && activity.errorMessage ? (
                        <p className="mt-1 text-xs text-red-500">{activity.errorMessage}</p>
                      ) : null}
                    </div>
                  </motion.article>
                ))
              )}
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
