"use client";

import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { Plus_Jakarta_Sans } from "next/font/google";
import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type StatsMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  accent?: "primary" | "green" | "red" | "default";
  icon: string;
};

type ActivitySeries = {
  id: string;
  label: string;
  percentage: number;
};

type ClubAdminStatsClientProps = {
  clubId: string;
  clubName: string;
  metrics: StatsMetric[];
  attendanceSeries: ActivitySeries[];
};

const DETAIL_TONE_CLASS = {
  primary: "text-green-600",
  green: "text-green-600",
  red: "text-red-500",
  default: "text-slate-500",
} as const;

const GROWTH_MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월"];
const MONTHLY_BARS = [
  { id: "m1", label: "1월", heightClassName: "h-1/2", fillClassName: "h-[40%]" },
  { id: "m2", label: "2월", heightClassName: "h-2/3", fillClassName: "h-[60%]" },
  { id: "m3", label: "3월", heightClassName: "h-[45%]", fillClassName: "h-[45%]" },
  { id: "m4", label: "4월", heightClassName: "h-3/4", fillClassName: "h-[80%]" },
  { id: "m5", label: "5월", heightClassName: "h-full", fillClassName: "h-[95%]", max: true },
  { id: "m6", label: "6월", heightClassName: "h-4/5", fillClassName: "h-[75%]" },
];

export function ClubAdminStatsClient({
  clubName,
  metrics,
  attendanceSeries,
}: ClubAdminStatsClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <div
      className={`${plusJakartaSans.className} min-h-screen bg-[#fdf8f6] text-slate-900`}
      style={
        {
          "--primary": "#f97316",
          "--secondary": "#135bec",
        } as CSSProperties
      }
    >
      <div className="min-h-screen bg-[#fdf8f6]">
        <ClubPageHeader
          title="통계 대시보드"
          subtitle={clubName}
          icon="monitoring"
          theme="admin"
          containerClassName="max-w-md"
          className="border-orange-100"
        />

        <main className="semo-nav-bottom-space mx-auto max-w-md">
          <motion.section className="grid grid-cols-2 gap-3 p-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
            {metrics.map((metric, index) => (
              <motion.article
                key={metric.id}
                className="rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 p-4"
                {...staggeredFadeUpMotion(index + 1, reduceMotion)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="material-symbols-outlined text-xl text-[var(--primary)]">
                    {metric.icon}
                  </span>
                  <span className={`text-xs font-bold ${DETAIL_TONE_CLASS[metric.accent ?? "default"]}`}>
                    {metric.detail}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600">{metric.label}</p>
                <p className="mt-1 text-2xl font-bold">{metric.value}</p>
              </motion.article>
            ))}
          </motion.section>

          <motion.section
            className="mx-4 mb-6 rounded-xl border border-orange-50 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(5, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">회원 증가 추이</h3>
                <p className="text-xs text-slate-500">최근 6개월 데이터</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[var(--primary)]">1,200명</p>
                <p className="text-[10px] font-bold text-green-500">전월 대비 +15%</p>
              </div>
            </div>
            <div className="relative h-40 w-full">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 400 150" aria-hidden="true">
                <defs>
                  <linearGradient id="admin-stats-growth" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "rgba(249,115,22,0.3)", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "rgba(249,115,22,0)", stopOpacity: 0 }} />
                  </linearGradient>
                </defs>
                <path
                  d="M0,130 C40,110 80,120 120,80 C160,40 200,60 240,40 C280,20 320,50 360,10 L400,10 L400,150 L0,150 Z"
                  fill="url(#admin-stats-growth)"
                />
                <path
                  d="M0,130 C40,110 80,120 120,80 C160,40 200,60 240,40 C280,20 320,50 360,10"
                  fill="none"
                  stroke="#f97316"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
                <circle cx="120" cy="80" r="4" fill="#f97316" />
                <circle cx="240" cy="40" r="4" fill="#f97316" />
                <circle cx="360" cy="10" r="4" fill="#f97316" />
              </svg>
            </div>
            <div className="mt-2 flex justify-between px-2 text-[10px] font-bold text-slate-400">
              {GROWTH_MONTH_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="mx-4 mb-6 rounded-xl border border-orange-50 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(6, reduceMotion)}
          >
            <h3 className="mb-4 font-bold text-slate-800">월간 출석 현황</h3>
            <div className="flex h-40 items-end justify-between gap-2 px-2">
              {MONTHLY_BARS.map((bar, index) => (
                <motion.div
                  key={bar.id}
                  className={`relative flex-1 rounded-t-lg bg-[var(--primary)]/10 ${bar.heightClassName}`}
                  {...staggeredFadeUpMotion(index + 7, reduceMotion)}
                >
                  <div
                    className={`absolute inset-x-0 bottom-0 mt-auto rounded-t-lg ${
                      bar.max ? "bg-[var(--primary)]" : "bg-[var(--primary)]/40"
                    } ${bar.fillClassName}`}
                  />
                  {bar.max ? (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[var(--primary)]">
                      최고
                    </div>
                  ) : null}
                </motion.div>
              ))}
            </div>
            <div className="mt-3 flex justify-between px-2 text-[10px] font-bold text-slate-400">
              {MONTHLY_BARS.map((bar) => (
                <span key={bar.id}>{bar.label}</span>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="mx-4 mb-6 rounded-xl border border-orange-50 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(13, reduceMotion)}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">매출·지출 추이</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                  <span className="text-[10px] font-medium text-slate-500">매출</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-medium text-slate-500">지출</span>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-medium">이번 달 매출 목표 (85%)</span>
                  <span className="font-bold">₩10,200,000 / 12,000,000</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[85%] rounded-full bg-[var(--primary)]" />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-medium">지출 예산 집행 (62%)</span>
                  <span className="font-bold">₩4,800,000 / 7,500,000</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[62%] rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="mx-4 mb-6 rounded-xl border border-orange-50 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(14, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">주간 참여 추이</h3>
              <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[10px] font-bold text-[var(--primary)]">
                최근 5주
              </span>
            </div>
            <div className="flex h-32 items-end justify-between gap-3">
              {attendanceSeries.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="flex flex-1 flex-col items-center gap-2"
                  {...staggeredFadeUpMotion(index + 15, reduceMotion)}
                >
                  <div className="flex h-full w-full items-end rounded-xl bg-slate-100 p-2">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-[var(--primary)] to-orange-300"
                      style={{ height: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-slate-900">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.percentage}%</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
