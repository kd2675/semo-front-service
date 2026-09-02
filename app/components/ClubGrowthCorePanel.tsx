"use client";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { ClubGrowthCoreExplainerTrigger } from "@/app/components/ClubGrowthCoreExplainer";
import type { ClubGrowthCore } from "@/app/lib/clubs";
import {
  getActivitySparkleCount,
  getMemberTriangleCount,
  getTierAchievedStage,
  getTierDisplayLabel,
  getTierTransitionProgress,
} from "@/app/lib/growthCore";
import { inViewFadeUpMotion } from "@/app/lib/motion";

type ClubGrowthCorePanelProps = {
  growthCore?: ClubGrowthCore | null;
  compact?: boolean;
};

const AXES = [
  { key: "togetherProgress", label: "함께", description: "출석 · 투표 · 읽기 · 공동 완료" },
  { key: "operationsProgress", label: "운영", description: "공지 · 업무 완료 · 응답 · 마감" },
  { key: "continuityProgress", label: "이어짐", description: "결정 연결 · 반복 업무 · 인수인계" },
] as const;

function growthLabel(progress: number) {
  const achievedStage = getTierAchievedStage(progress);
  return `${achievedStage}/3 달성`;
}

function activityLabel(level: number) {
  return ["고요함", "움직임 시작", "꾸준한 움직임", "활발한 움직임", "매우 활발함"][
    Math.max(0, Math.min(4, Math.round(level)))
  ];
}

export function ClubGrowthCorePanel({ growthCore, compact = false }: ClubGrowthCorePanelProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const tierLabel = getTierDisplayLabel(growthCore);
  const nextTierLabel = growthCore?.nextTierLabel;
  const activityLevel = growthCore?.activityLevel ?? 0;
  const activitySparkleCount = getActivitySparkleCount(activityLevel);
  const memberCount = Math.max(0, Math.floor(growthCore?.memberCount ?? 0));
  const memberTriangleCount = getMemberTriangleCount(memberCount);
  const tierAchievedStage = getTierAchievedStage(getTierTransitionProgress(growthCore));

  return (
    <motion.section className="semo-card overflow-hidden" {...inViewFadeUpMotion(0, reduceMotion)}>
      <div className={compact ? "p-4" : "p-5 md:p-6"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold tracking-[0.16em] text-[var(--primary)]">SEMO · 모임 성장</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">보석 티어와 모임 성장 스탯</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              고정 크기 ‘티어: 보석’과 하단 ‘규모: 세모’·‘활동: 반짝임’을, 뒤쪽 삼각 스탯은 함께·운영·이어짐의 균형을 보여줍니다.
            </p>
          </div>
          <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
            최근 14일 · {activityLabel(activityLevel)}
          </span>
        </div>

        <div
          className="relative mt-5 overflow-hidden rounded-[var(--radius-card)] border border-slate-800 bg-[radial-gradient(circle_at_24%_42%,rgba(37,99,235,0.26),transparent_34%),linear-gradient(145deg,#0c1422,#17233a)] text-white shadow-sm"
          data-growth-stat-layout="tier-background"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 size-52 rotate-12 border border-sky-300/10" aria-hidden="true" />
          <div className={`relative grid ${compact ? "" : "md:grid-cols-[minmax(16rem,0.9fr)_minmax(0,1.1fr)]"}`}>
            <div
              className={`relative flex min-h-72 flex-col border-white/10 px-4 pb-4 pt-5 ${compact ? "border-b" : "border-b md:border-b-0 md:border-r"}`}
              data-growth-core-tier-panel="primary"
              data-growth-triangle-placement="behind-tier"
            >
              <div className="flex items-center justify-between gap-3 text-xs font-extrabold tracking-[0.12em]">
                <span className="text-sky-300">TIER</span>
                <span className="text-slate-400">{memberCount} MEMBERS</span>
              </div>
              <div className="mt-3 h-px bg-gradient-to-r from-transparent via-sky-300/25 to-transparent" />

              <div
                className="relative mx-auto aspect-square w-full max-w-72 flex-1"
                data-growth-triangle-layer="background"
              >
                <ClubGrowthCoreExplainerTrigger
                  growthCore={growthCore}
                  size={compact ? 232 : 272}
                  animateActivity={!compact}
                  presentation="full"
                  className="absolute inset-0 size-full"
                  surfaceClassName="rounded-xl"
                  markClassName="size-full"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-sky-200/20 bg-sky-100/10 px-3 py-1 text-xs font-extrabold tracking-[0.08em] text-white">
                  {tierLabel}
                </span>
                <span className="text-xs font-bold text-slate-300">
                  규모: 세모 {memberTriangleCount}개 · 활동: 반짝임 {activitySparkleCount}개
                </span>
              </div>
            </div>

            <div className="relative p-4 md:p-5" data-growth-stat-panel="detail">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black tracking-[0.18em] text-sky-300">GROWTH STATS</p>
                  <p className="mt-1 text-xs text-slate-400">세 축의 가장 낮은 값이 현재 단계를 결정합니다.</p>
                </div>
                <span className="shrink-0 rounded-full border border-sky-300/20 bg-sky-300/10 px-2.5 py-1 text-xs font-extrabold text-sky-200">
                  {nextTierLabel ? `${nextTierLabel} · ${tierAchievedStage}/3 달성` : "최종 티어"}
                </span>
              </div>

              <div className="mt-5 grid min-w-0 gap-5">
                {AXES.map((axis, index) => {
                  const progress = Math.max(0, Math.min(100, growthCore?.[axis.key] ?? 0));
                  return (
                    <motion.div key={axis.key} {...inViewFadeUpMotion(index + 1, reduceMotion)}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-extrabold text-white">{axis.label}</p>
                        <span className="shrink-0 text-xs font-bold text-sky-200">{growthLabel(progress)}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{axis.description}</p>
                      <div
                        className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-label={`${axis.label} 성장`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                      >
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
                          initial={{ width: reduceMotion ? `${progress}%` : 0 }}
                          whileInView={{ width: `${progress}%` }}
                          viewport={{ once: true, amount: 0.8 }}
                          transition={{ duration: reduceMotion ? 0.01 : 0.7, delay: reduceMotion ? 0 : index * 0.12, ease: "easeOut" }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
          {nextTierLabel
            ? `다음 티어는 ${nextTierLabel}이며 현재 ${tierAchievedStage}/3단계를 달성했습니다. 0/3에서도 시작 삼각형을 유지하고, 각 축은 33%·66%·100%에 도달할 때만 다음 점선 꼭짓점으로 이동합니다. 점선 사이에서는 위치가 변하지 않으며 세 축 모두 100%에 닿으면 티어가 올라갑니다.`
            : "최종 티어에 도달했습니다. 이 표시는 순위가 아니라 모임에 남은 운영 기록의 누적 단계입니다."}
        </p>
      </div>
    </motion.section>
  );
}
