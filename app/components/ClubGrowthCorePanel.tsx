"use client";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { ClubGrowthCoreMark } from "@/app/components/ClubGrowthCoreMark";
import type { ClubGrowthCore } from "@/app/lib/clubs";
import { getTierTransitionProgress, getTierTransitionStage } from "@/app/lib/growthCore";
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
  if (progress >= 100) return "완성";
  if (progress >= 75) return "거의 완성";
  if (progress >= 35) return "자라는 중";
  if (progress > 0) return "성장 시작";
  return "기록 대기";
}

function activityLabel(level: number) {
  return ["고요함", "움직임 시작", "꾸준한 움직임", "활발한 움직임", "매우 활발함"][
    Math.max(0, Math.min(4, Math.round(level)))
  ];
}

export function ClubGrowthCorePanel({ growthCore, compact = false }: ClubGrowthCorePanelProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const tierLabel = growthCore?.tierLabel ?? "원석";
  const nextTierLabel = growthCore?.nextTierLabel;
  const activityLevel = growthCore?.activityLevel ?? 0;
  const tierTransitionStage = getTierTransitionStage(getTierTransitionProgress(growthCore));

  return (
    <motion.section className="semo-card overflow-hidden" {...inViewFadeUpMotion(0, reduceMotion)}>
      <div className={`grid ${compact ? "gap-4 p-4" : "gap-6 p-5 md:grid-cols-[12rem_1fr] md:p-6"}`}>
        <div className="relative flex min-h-44 items-center justify-center overflow-hidden rounded-[var(--radius-card)] bg-[radial-gradient(circle_at_50%_38%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_58%),linear-gradient(145deg,#f8fafc,#eef4ff)]">
          <div className="absolute inset-x-6 top-5 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/35 to-transparent" />
          {nextTierLabel ? (
            <span className="absolute right-3 top-3 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-xs font-extrabold text-[var(--primary)] shadow-sm">
              {nextTierLabel}까지 {tierTransitionStage}/3
            </span>
          ) : null}
          <ClubGrowthCoreMark
            growthCore={growthCore}
            size={compact ? 132 : 164}
            animateActivity={!compact}
          />
          <span className="absolute bottom-3 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-extrabold tracking-[0.08em] text-slate-700 shadow-sm">
            {tierLabel} 코어
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold tracking-[0.16em] text-[var(--primary)]">SEMO · 모임 성장</p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">세 꼭짓점이 함께 만드는 성장</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                활성 멤버가 많을수록 코어가 커지고 실제 모임 기록이 세 축을 키웁니다. 세 축이 모두 차면
                현재 삼각은 코어에 흡수되고, 소재가 올라간 작은 삼각으로 다음 성장을 시작합니다.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                코어 {activityLabel(activityLevel)}
              </span>
              <span className="text-xs text-slate-400">최근 14일 기록 기준</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {AXES.map((axis, index) => {
              const progress = growthCore?.[axis.key] ?? 0;
              return (
                <motion.div key={axis.key} {...inViewFadeUpMotion(index + 1, reduceMotion)}>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">{axis.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{axis.description}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-slate-500">{growthLabel(progress)}</span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label={`${axis.label} 성장`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                  >
                    <motion.div
                      className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
                      initial={{ width: reduceMotion ? `${Math.max(0, Math.min(100, progress))}%` : 0 }}
                      whileInView={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: reduceMotion ? 0.01 : 0.7, delay: reduceMotion ? 0 : index * 0.12, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
            {nextTierLabel
              ? `다음 소재는 ${nextTierLabel}이며 현재 3단계 중 ${tierTransitionStage}단계입니다. 세 축 중 가장 낮은 진행값이 33%·66% 점선을 넘을 때 다음 단계로 이동하고, 세 축 모두 100%에 닿으면 소재가 올라갑니다.`
              : "최종 소재에 도달했습니다. 이 표시는 순위가 아니라 모임에 남은 운영 기록의 누적 단계입니다."}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
