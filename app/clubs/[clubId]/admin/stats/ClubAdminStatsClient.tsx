"use client";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

export type ClubAdminStatsMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  accent?: "primary" | "green" | "red" | "default";
  icon: string;
};

export type ClubAdminStatsSnapshotItem = {
  id: string;
  label: string;
  value: string;
  detail: string;
  accent?: "primary" | "green" | "red" | "default";
};

export type ClubAdminStatsActivity = {
  id: number;
  subject: string;
  detail: string;
  status: "SUCCESS" | "FAIL" | string;
  createdAtLabel: string;
};

type ClubAdminStatsClientProps = {
  clubName: string;
  partialData: boolean;
  metrics: ClubAdminStatsMetric[];
  memberSnapshotItems: ClubAdminStatsSnapshotItem[];
  memberActivityItems: ClubAdminStatsSnapshotItem[];
  recentActivities: ClubAdminStatsActivity[];
};

const TONE_CLASS = {
  primary: "text-[var(--primary)]",
  green: "text-emerald-600",
  red: "text-rose-500",
  default: "text-slate-500",
} as const;

const PANEL_TONE_CLASS = {
  primary: "border-[var(--primary)]/20 bg-[var(--primary)]/10",
  green: "border-emerald-200 bg-emerald-50",
  red: "border-rose-200 bg-rose-50",
  default: "border-slate-200 bg-slate-50",
} as const;

const ACTIVITY_STATUS_CLASS = {
  SUCCESS: "bg-emerald-100 text-emerald-700",
  FAIL: "bg-rose-100 text-rose-600",
} as const;

function SnapshotGrid({
  title,
  caption,
  items,
  reduceMotion,
  baseDelay,
}: {
  title: string;
  caption: string;
  items: ClubAdminStatsSnapshotItem[];
  reduceMotion: boolean;
  baseDelay: number;
}) {
  return (
    <motion.section
      className="mx-4 mb-6 rounded-xl border border-orange-100 bg-white p-5 shadow-sm"
      {...staggeredFadeUpMotion(baseDelay, reduceMotion)}
    >
      <div className="mb-4">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{caption}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, index) => {
          const accent = item.accent ?? "default";
          return (
            <motion.article
              key={item.id}
              className={`rounded-xl border p-4 ${PANEL_TONE_CLASS[accent]}`}
              {...staggeredFadeUpMotion(baseDelay + index + 1, reduceMotion)}
            >
              <p className="text-xs font-semibold text-slate-500">{item.label}</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{item.value}</p>
              <p className={`mt-1 text-xs font-medium ${TONE_CLASS[accent]}`}>{item.detail}</p>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}

export function ClubAdminStatsClient({
  clubName,
  partialData,
  metrics,
  memberSnapshotItems,
  memberActivityItems,
  recentActivities,
}: ClubAdminStatsClientProps) {
  const reduceMotion = useHydrationSafeReducedMotion();

  return (
    <div className="min-h-screen bg-[var(--background-light)] text-slate-900">
      <div className="min-h-screen bg-[var(--background-light)]">
        <ClubPageHeader
          title="통계 대시보드"
          subtitle={clubName}
          icon="monitoring"
          theme="admin"
          containerClassName="semo-page-admin"
          className="border-orange-100"
        />

        <main className="semo-page-admin semo-nav-bottom-space">
          {partialData ? (
            <motion.section
              className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              {...staggeredFadeUpMotion(0, reduceMotion)}
            >
              일부 공통 지표를 불러오지 못해 현재 조회 가능한 정보만 표시합니다.
            </motion.section>
          ) : null}

          <motion.section
            className="grid grid-cols-2 gap-3 p-4"
            {...staggeredFadeUpMotion(partialData ? 1 : 0, reduceMotion)}
          >
            {metrics.map((metric, index) => {
              const accent = metric.accent ?? "default";
              return (
                <motion.article
                  key={metric.id}
                  className={`rounded-xl border p-4 ${PANEL_TONE_CLASS[accent]}`}
                  {...staggeredFadeUpMotion(index + 1, reduceMotion)}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className={`material-symbols-outlined text-xl ${TONE_CLASS[accent]}`}>
                      {metric.icon}
                    </span>
                    <span className={`text-xs font-bold ${TONE_CLASS[accent]}`}>
                      {metric.detail}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{metric.value}</p>
                </motion.article>
              );
            })}
          </motion.section>

          <SnapshotGrid
            title="회원 분포"
            caption="기능 활성화 여부와 무관한 관리자 공통 멤버 지표입니다."
            items={memberSnapshotItems}
            reduceMotion={reduceMotion}
            baseDelay={8}
          />

          <SnapshotGrid
            title="운영 관찰 포인트"
            caption="멤버 관리 기준으로 지금 확인할 만한 상태만 묶었습니다."
            items={memberActivityItems}
            reduceMotion={reduceMotion}
            baseDelay={14}
          />

          <motion.section
            className="mx-4 mb-6 rounded-xl border border-orange-100 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(20, reduceMotion)}
          >
            <div className="mb-4">
              <h3 className="font-bold text-slate-900">최근 운영 로그</h3>
              <p className="mt-1 text-sm text-slate-500">기능별 운영 화면이 아니라 관리자 공통 기록입니다.</p>
            </div>

            {recentActivities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                아직 기록된 운영 로그가 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => {
                  const statusClass =
                    ACTIVITY_STATUS_CLASS[
                      activity.status as keyof typeof ACTIVITY_STATUS_CLASS
                    ] ?? "bg-slate-100 text-slate-600";

                  return (
                    <motion.article
                      key={activity.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                      {...staggeredFadeUpMotion(21 + index, reduceMotion)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{activity.subject}</p>
                          <p className="mt-1 text-sm text-slate-600">{activity.detail}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${statusClass}`}>
                          {activity.status === "FAIL" ? "실패" : "성공"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-400">{activity.createdAtLabel}</p>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </motion.section>
        </main>
      </div>
    </div>
  );
}
