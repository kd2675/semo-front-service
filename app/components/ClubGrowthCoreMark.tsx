"use client";

import { useId } from "react";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import type { ClubGrowthCore } from "@/app/lib/clubs";
import {
  clampGrowthProgress,
  getTierTransitionProgress,
  getTierTransitionStage,
  TIER_STAGE_GUIDES,
  type TierTransitionStage,
} from "@/app/lib/growthCore";

type ClubGrowthCoreMarkProps = {
  growthCore?: ClubGrowthCore | null;
  size?: number;
  animateActivity?: boolean;
  presentation?: "full" | "core-only";
  className?: string;
};

type MaterialPalette = {
  dark: string;
  middle: string;
  light: string;
  highlight: string;
};

const INITIAL_CORE: ClubGrowthCore = {
  tierCode: "RAW",
  tierLabel: "원석",
  nextTierCode: "IRON",
  nextTierLabel: "아이언",
  togetherProgress: 0,
  operationsProgress: 0,
  continuityProgress: 0,
  memberCount: 0,
  activityLevel: 0,
  policyVersion: 1,
  lastProjectedAt: null,
};

const MATERIALS: Record<string, MaterialPalette> = {
  RAW: { dark: "#475569", middle: "#64748b", light: "#cbd5e1", highlight: "#f8fafc" },
  IRON: { dark: "#1f2937", middle: "#64748b", light: "#d7dee7", highlight: "#ffffff" },
  BRONZE: { dark: "#713f12", middle: "#b45309", light: "#f0b96d", highlight: "#fff1cf" },
  SILVER: { dark: "#64748b", middle: "#cbd5e1", light: "#f8fafc", highlight: "#ffffff" },
  GOLD: { dark: "#a16207", middle: "#f5b51b", light: "#fde68a", highlight: "#fffbea" },
  PLATINUM: { dark: "#0f766e", middle: "#5eead4", light: "#ccfbf1", highlight: "#ffffff" },
  DIAMOND: { dark: "#1d4ed8", middle: "#60a5fa", light: "#c4b5fd", highlight: "#ffffff" },
};

const INITIAL_GROWTH_RADIUS = 24;
const TIER_STAGE_RADII: Record<TierTransitionStage, number> = {
  1: 30,
  2: 43,
  3: 56,
};

function growthRadius(progress: number): number {
  const normalizedProgress = clampGrowthProgress(progress);
  const firstThreshold = TIER_STAGE_GUIDES[0].threshold;
  const secondThreshold = TIER_STAGE_GUIDES[1].threshold;

  if (normalizedProgress <= firstThreshold) {
    return INITIAL_GROWTH_RADIUS
      + (TIER_STAGE_RADII[1] - INITIAL_GROWTH_RADIUS) * (normalizedProgress / firstThreshold);
  }
  if (normalizedProgress <= secondThreshold) {
    return TIER_STAGE_RADII[1]
      + (TIER_STAGE_RADII[2] - TIER_STAGE_RADII[1])
      * ((normalizedProgress - firstThreshold) / (secondThreshold - firstThreshold));
  }
  return TIER_STAGE_RADII[2]
    + (TIER_STAGE_RADII[3] - TIER_STAGE_RADII[2])
    * ((normalizedProgress - secondThreshold) / (100 - secondThreshold));
}

function trianglePointAtRadius(radius: number, direction: "top" | "right" | "left") {
  if (direction === "top") {
    return `60,${64 - radius}`;
  }
  const xOffset = radius * 0.866;
  const yOffset = radius * 0.5;
  return direction === "right"
    ? `${60 + xOffset},${64 + yOffset}`
    : `${60 - xOffset},${64 + yOffset}`;
}

function trianglePoint(progress: number, direction: "top" | "right" | "left") {
  return trianglePointAtRadius(growthRadius(progress), direction);
}

function trianglePointsAtRadius(radius: number) {
  return [
    trianglePointAtRadius(radius, "top"),
    trianglePointAtRadius(radius, "right"),
    trianglePointAtRadius(radius, "left"),
  ].join(" ");
}

function memberCoreRadius(value: number | undefined) {
  const memberCount = Number.isFinite(value) ? Math.max(1, Math.floor(value ?? 0)) : 1;
  if (memberCount <= 1) return 9;
  if (memberCount <= 4) return 11;
  if (memberCount <= 9) return 13;
  if (memberCount <= 19) return 15;
  if (memberCount <= 49) return 17;
  if (memberCount <= 99) return 18;
  return 19;
}

export function ClubGrowthCoreMark({
  growthCore,
  size = 80,
  animateActivity = false,
  presentation = "full",
  className,
}: ClubGrowthCoreMarkProps) {
  const core = growthCore ?? INITIAL_CORE;
  const prefersReducedMotion = useHydrationSafeReducedMotion();
  const id = useId().replaceAll(":", "");
  const palette = MATERIALS[core.tierCode] ?? MATERIALS.RAW;
  const together = clampGrowthProgress(core.togetherProgress);
  const operations = clampGrowthProgress(core.operationsProgress);
  const continuity = clampGrowthProgress(core.continuityProgress);
  const memberCount = Number.isFinite(core.memberCount) ? Math.max(0, Math.floor(core.memberCount)) : 0;
  const activityLevel = Math.max(0, Math.min(4, Math.round(core.activityLevel ?? 0)));
  const coreRadius = memberCoreRadius(memberCount);
  const showGrowthFrame = presentation === "full";
  const hasNextTier = Boolean(core.nextTierCode || core.nextTierLabel);
  const tierTransitionProgress = getTierTransitionProgress(core);
  const tierTransitionStage = getTierTransitionStage(tierTransitionProgress);
  const togetherRadius = growthRadius(together);
  const operationsRadius = growthRadius(operations);
  const continuityRadius = growthRadius(continuity);
  const currentTriangle = [trianglePoint(together, "top"), trianglePoint(operations, "right"), trianglePoint(continuity, "left")].join(" ");
  const ariaLabel = showGrowthFrame
    ? `${core.tierLabel} 코어. 활성 멤버 ${memberCount}명, 함께 ${together}%, 운영 ${operations}%, 이어짐 ${continuity}%, 최근 활동 밝기 ${activityLevel}단계.${hasNextTier ? ` ${core.nextTierLabel ?? "다음 소재"}까지 3단계 중 ${tierTransitionStage}단계.` : " 최종 소재 단계."}`
    : `${core.tierLabel} 소재 코어. 활성 멤버 ${memberCount}명에 따른 크기, 최근 활동 밝기 ${activityLevel}단계.`;
  const glowOpacity = 0.12 + activityLevel * 0.12;
  const shouldAnimate = animateActivity && activityLevel > 0 && !prefersReducedMotion;

  return (
    <svg
      width={size}
      height={size}
      viewBox={showGrowthFrame ? "0 0 120 120" : "34 38 52 52"}
      role="img"
      aria-label={ariaLabel}
      data-presentation={presentation}
      className={className}
    >
      <defs>
        <linearGradient id={`${id}-frame`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" stopOpacity="0.9" />
          <stop offset="0.52" stopColor="#135bec" />
          <stop offset="1" stopColor="#1e40af" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id={`${id}-core`} cx="34%" cy="26%" r="74%">
          <stop offset="0" stopColor={palette.highlight} />
          <stop offset="0.32" stopColor={palette.light} />
          <stop offset="0.7" stopColor={palette.middle} />
          <stop offset="1" stopColor={palette.dark} />
        </radialGradient>
        <filter id={`${id}-core-glow`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation={2.2 + activityLevel * 0.7} result="blur" />
          <feFlood floodColor={palette.light} floodOpacity={glowOpacity} result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {showGrowthFrame ? (
        <>
          <polygon
            points={currentTriangle}
            fill={`url(#${id}-frame)`}
            fillOpacity="0.1"
            stroke={`url(#${id}-frame)`}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {hasNextTier
            ? TIER_STAGE_GUIDES.map(({ stage }) => {
                const state = stage < tierTransitionStage
                  ? "passed"
                  : stage === tierTransitionStage
                    ? "current"
                    : "upcoming";
                return (
                  <polygon
                    key={stage}
                    points={trianglePointsAtRadius(TIER_STAGE_RADII[stage])}
                    fill="none"
                    stroke={state === "upcoming" ? "#94a3b8" : state === "passed" ? "#60a5fa" : "#135bec"}
                    strokeOpacity={state === "current" ? 0.9 : state === "passed" ? 0.72 : 0.54}
                    strokeWidth={state === "current" ? 1.3 : state === "passed" ? 1 : 0.9}
                    strokeDasharray="3 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    data-tier-stage={stage}
                    data-tier-stage-state={state}
                    aria-hidden="true"
                  />
                );
              })
            : null}
          <circle cx="60" cy={64 - togetherRadius} r="2.2" fill="#135bec" />
          <circle cx={60 + operationsRadius * 0.866} cy={64 + operationsRadius * 0.5} r="2.2" fill="#135bec" />
          <circle cx={60 - continuityRadius * 0.866} cy={64 + continuityRadius * 0.5} r="2.2" fill="#135bec" />
        </>
      ) : null}

      {shouldAnimate ? (
        <motion.circle
          cx="60"
          cy="64"
          r={coreRadius + 4}
          fill={palette.light}
          initial={false}
          animate={{ opacity: [0.06, glowOpacity, 0.06], scale: [0.92, 1.12, 0.92] }}
          transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          style={{ transformOrigin: "60px 64px" }}
        />
      ) : (
        <circle cx="60" cy="64" r={coreRadius + 4} fill={palette.light} opacity={glowOpacity * 0.55} />
      )}

      <motion.g
        filter={`url(#${id}-core-glow)`}
        initial={false}
        animate={shouldAnimate ? { scale: [1, 1.035, 1] } : { scale: 1 }}
        transition={{ duration: 2.8, repeat: shouldAnimate ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
        style={{ transformOrigin: "60px 64px" }}
      >
        <polygon
          points={`60,${64 - coreRadius} ${60 + coreRadius * 0.86},${64 - coreRadius * 0.24} ${60 + coreRadius * 0.62},${64 + coreRadius * 0.78} 60,${64 + coreRadius} ${60 - coreRadius * 0.62},${64 + coreRadius * 0.78} ${60 - coreRadius * 0.86},${64 - coreRadius * 0.24}`}
          fill={`url(#${id}-core)`}
          stroke={palette.highlight}
          strokeOpacity="0.68"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        <path
          d={`M60 ${64 - coreRadius} L60 64 L${60 + coreRadius * 0.86} ${64 - coreRadius * 0.24} M60 64 L${60 + coreRadius * 0.62} ${64 + coreRadius * 0.78} M60 64 L${60 - coreRadius * 0.62} ${64 + coreRadius * 0.78} M60 64 L${60 - coreRadius * 0.86} ${64 - coreRadius * 0.24}`}
          fill="none"
          stroke={palette.highlight}
          strokeOpacity="0.44"
          strokeWidth="0.8"
        />
        <motion.ellipse
          cx={60 - coreRadius * 0.2}
          cy={64 - coreRadius * 0.3}
          rx={Math.max(1.2, coreRadius * 0.18)}
          ry={Math.max(0.8, coreRadius * 0.1)}
          fill="#ffffff"
          opacity={0.28 + activityLevel * 0.1}
          initial={false}
          animate={
            shouldAnimate
              ? { opacity: [0.18 + activityLevel * 0.08, 0.4 + activityLevel * 0.11, 0.18 + activityLevel * 0.08] }
              : { opacity: 0.28 + activityLevel * 0.1 }
          }
          transition={{ duration: 2.3, repeat: shouldAnimate ? Number.POSITIVE_INFINITY : 0, ease: "easeInOut" }}
        />
      </motion.g>
    </svg>
  );
}
