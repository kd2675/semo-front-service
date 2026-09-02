"use client";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

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
  href: string;
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
  const reduceMotion = useHydrationSafeReducedMotion();

  return (
    <div className="semo-app-shell text-slate-900">
      <ClubPageHeader
        title="관리자"
        subtitle={clubName}
        icon="admin_panel_settings"
        theme="admin"
        containerClassName="semo-page-admin"
      />

      <main className="semo-page-admin semo-nav-bottom-space space-y-7 px-4 pt-4 md:px-6">
          <motion.section
            className={`semo-metric-strip grid-cols-2 ${metrics.length > 2 ? "semo-metric-strip-wide md:grid-cols-4" : ""}`}
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            {metrics.map((metric) => (
              <article
                key={metric.id}
                className="semo-metric-cell"
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
                  className={`mt-1 flex items-center gap-1 text-xs ${
                    DETAIL_TONE_CLASS[metric.detailTone ?? "slate"]
                  }`}
                >
                  <span className="material-symbols-outlined text-xs" aria-hidden="true">{metric.detailIcon}</span>
                  {metric.detail}
                </p>
              </article>
            ))}
          </motion.section>

          <motion.section {...staggeredFadeUpMotion(4, reduceMotion)}>
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">dashboard</span>
              <h2 className="text-lg font-bold">대시보드 개요</h2>
            </div>
            <div className="semo-list">
              {actions.map((action) => (
                  <RouterLink
                    key={action.id}
                    href={action.href}
                    className="semo-list-row group"
                  >
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary)]/10 text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                      <span className="material-symbols-outlined text-2xl" aria-hidden="true">{action.icon}</span>
                    </div>
                    <div className="min-w-0 flex flex-1 flex-col justify-center gap-1">
                      <h3 className="text-base font-bold leading-tight">{action.title}</h3>
                      <p className="text-sm leading-normal text-slate-500">{action.description}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true">chevron_right</span>
                  </RouterLink>
              ))}
            </div>
          </motion.section>

          <motion.section {...staggeredFadeUpMotion(9, reduceMotion)}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">history</span>
                <h2 className="text-lg font-bold">최근 활동</h2>
              </div>
              <RouterLink
                href={`/clubs/${clubId}/admin/logs`}
                className="semo-quiet-link"
              >
                전체 로그 보기
              </RouterLink>
            </div>
            <div className="semo-list">
              {activities.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">아직 기록된 최근 활동이 없습니다.</div>
              ) : (
                activities.map((activity, index) => (
                  <article
                    key={activity.activityId}
                    className={`semo-list-row items-start ${index > 0 ? "" : ""}`}
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-[var(--primary)]/12 text-xs font-bold text-[var(--primary)]">
                      {activity.actorAvatarLabel}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700">
                        <span className="font-bold text-slate-900">{activity.actorDisplayName}</span>{" "}
                        {activity.detail}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                          {activity.subject}
                        </span>
                        <span className="text-slate-400">
                          {formatRelativeTime(activity.createdAt, activity.createdAtLabel)}
                        </span>
                        {activity.status === "FAIL" ? (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 font-semibold text-rose-600">
                            실패
                          </span>
                        ) : null}
                      </div>
                      {activity.status === "FAIL" && activity.errorMessage ? (
                        <p className="mt-1 text-xs text-rose-500">{activity.errorMessage}</p>
                      ) : null}
                    </div>
                  </article>
                ))
              )}
            </div>
          </motion.section>
      </main>
    </div>
  );
}
