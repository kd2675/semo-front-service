"use client";

import { useId } from "react";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import type { ClubGrowthCore } from "@/app/lib/clubs";
import {
  clampGrowthProgress,
  DEFAULT_CLUB_GROWTH_CORE,
  getActivitySparkleCount,
  getGrowthAxisPoint,
  getGrowthStageVertices,
  getMemberTriangleCount,
  getTierAchievedStage,
  getTierDisplayLabel,
  getTierTransitionProgress,
  GROWTH_AXES,
  GROWTH_TRIANGLE_CENTER,
  TIER_STAGE_GUIDES,
  type GrowthPoint,
} from "@/app/lib/growthCore";

type ClubGrowthCoreMarkProps = {
  growthCore?: ClubGrowthCore | null;
  size?: number;
  animateActivity?: boolean;
  presentation?: "full" | "core-only" | "growth-only";
  className?: string;
};

type SparklePalette = {
  light: string;
  highlight: string;
};

const SPARKLE_PALETTES: Record<string, SparklePalette> = {
  RAW: { light: "#cbd5e1", highlight: "#f8fafc" },
  IRON: { light: "#d7dee7", highlight: "#ffffff" },
  BRONZE: { light: "#f0b96d", highlight: "#fff1cf" },
  SILVER: { light: "#f8fafc", highlight: "#ffffff" },
  GOLD: { light: "#fde68a", highlight: "#fffbea" },
  PLATINUM: { light: "#ccfbf1", highlight: "#ffffff" },
  DIAMOND: { light: "#c4b5fd", highlight: "#ffffff" },
};

const TIER_GEM_ASSETS: Record<string, string> = {
  RAW: "/image/growth-gems/raw.png",
  IRON: "/image/growth-gems/iron.png",
  BRONZE: "/image/growth-gems/bronze.png",
  SILVER: "/image/growth-gems/silver.png",
  GOLD: "/image/growth-gems/gold.png",
  PLATINUM: "/image/growth-gems/platinum.png",
  DIAMOND: "/image/growth-gems/diamond.png",
};

const CORE_ONLY_GEM_DIAMETER = 34;
const FULL_PANEL_GEM_DIAMETER = 44;
const GEM_SHADOW_COLOR = "#020617";
const ACTIVITY_SPARKLE_PATH = "M 0 -3.6 L 0.9 -0.9 L 3.6 0 L 0.9 0.9 L 0 3.6 L -0.9 0.9 L -3.6 0 L -0.9 -0.9 Z";
const ACTIVITY_SPARKLE_POSITIONS = [
  { xFactor: 0.72, yFactor: -0.72, scale: 1 },
  { xFactor: -0.78, yFactor: -0.54, scale: 0.82 },
  { xFactor: 0.96, yFactor: 0.12, scale: 0.7 },
  { xFactor: -0.5, yFactor: 0.86, scale: 0.64 },
  { xFactor: 0.55, yFactor: 0.78, scale: 0.56 },
] as const;
const MEMBER_TRIANGLE_PATH = "M 0 -2.1 L 2.2 1.7 L -2.2 1.7 Z";
const MEMBER_TRIANGLE_SLOTS = [0, 1, 2, 3, 4] as const;
const MEMBER_TRIANGLE_SPACING = 5.6;

function pointsAttribute(points: readonly GrowthPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function ClubGrowthCoreMark({
  growthCore,
  size = 80,
  animateActivity = false,
  presentation = "full",
  className,
}: ClubGrowthCoreMarkProps) {
  const core = growthCore ?? DEFAULT_CLUB_GROWTH_CORE;
  const prefersReducedMotion = useHydrationSafeReducedMotion();
  const id = useId().replaceAll(":", "");
  const tierCode = core.tierCode?.toUpperCase() ?? "RAW";
  const tierLabel = getTierDisplayLabel(core);
  const palette = SPARKLE_PALETTES[tierCode] ?? SPARKLE_PALETTES.RAW;
  const gemAssetPath = TIER_GEM_ASSETS[tierCode] ?? TIER_GEM_ASSETS.RAW;
  const together = clampGrowthProgress(core.togetherProgress);
  const operations = clampGrowthProgress(core.operationsProgress);
  const continuity = clampGrowthProgress(core.continuityProgress);
  const memberCount = Number.isFinite(core.memberCount) ? Math.max(0, Math.floor(core.memberCount)) : 0;
  const activityLevel = Math.max(0, Math.min(4, Math.round(core.activityLevel ?? 0)));
  const activitySparkleCount = getActivitySparkleCount(activityLevel);
  const memberTriangleCount = getMemberTriangleCount(memberCount);
  const gemDiameter = presentation === "full" ? FULL_PANEL_GEM_DIAMETER : CORE_ONLY_GEM_DIAMETER;
  const sparkleOrbitRadius = presentation === "full" ? 34 : 25;
  const memberTriangleRowY = presentation === "full" ? 91 : 89;
  const gemPosition = {
    x: 60 - gemDiameter / 2,
    y: 64 - gemDiameter / 2,
  };
  const showGrowthFrame = presentation !== "core-only";
  const showCore = presentation !== "growth-only";
  const showSeparatedGrowthStats = presentation === "growth-only";
  const hasNextTier = Boolean(core.nextTierCode || core.nextTierLabel);
  const tierTransitionProgress = getTierTransitionProgress(core);
  const tierAchievedStage = getTierAchievedStage(tierTransitionProgress);
  const togetherAchievedStage = getTierAchievedStage(together);
  const operationsAchievedStage = getTierAchievedStage(operations);
  const continuityAchievedStage = getTierAchievedStage(continuity);
  const currentVertices = [
    getGrowthAxisPoint(together, "together"),
    getGrowthAxisPoint(operations, "operations"),
    getGrowthAxisPoint(continuity, "continuity"),
  ];
  const currentTriangle = pointsAttribute(currentVertices);
  const initialStageVertices = getGrowthStageVertices(0);
  const outerStageVertices = getGrowthStageVertices(3);
  const ariaLabel = showSeparatedGrowthStats
    ? `모임 성장 스탯. 함께 ${togetherAchievedStage}/3단계, 운영 ${operationsAchievedStage}/3단계, 이어짐 ${continuityAchievedStage}/3단계.${hasNextTier ? ` ${core.nextTierLabel ?? "다음 티어"}까지 전체 ${tierAchievedStage}/3단계 달성.` : " 최종 티어 단계."}`
    : showGrowthFrame
      ? `${tierLabel} 티어: 보석. 활성 멤버 ${memberCount}명, 규모: 세모 ${memberTriangleCount}개, 함께 ${togetherAchievedStage}/3단계, 운영 ${operationsAchievedStage}/3단계, 이어짐 ${continuityAchievedStage}/3단계, 활동: 반짝임 ${activitySparkleCount}개.${hasNextTier ? ` ${core.nextTierLabel ?? "다음 티어"}까지 전체 ${tierAchievedStage}/3단계 달성.` : " 최종 티어 단계."}`
      : `${tierLabel} 티어: 보석. 활성 멤버 ${memberCount}명, 규모: 세모 ${memberTriangleCount}개, 활동: 반짝임 ${activitySparkleCount}개.`;
  const shouldAnimateSparkles = animateActivity && !prefersReducedMotion;

  return (
    <svg
      width={size}
      height={size}
      viewBox={presentation === "core-only" ? "30 34 60 60" : "0 0 120 120"}
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
        <filter id={`${id}-core-shadow`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.6" floodColor={GEM_SHADOW_COLOR} floodOpacity="0.58" />
        </filter>
      </defs>

      {showGrowthFrame ? (
        <>
          <g
            fill="none"
            stroke="#bfdbfe"
            strokeOpacity={showSeparatedGrowthStats ? 0.2 : 0.14}
            strokeWidth="0.6"
            strokeDasharray="1 5"
            vectorEffect="non-scaling-stroke"
            data-growth-axis-guides="vertex-aligned"
            aria-hidden="true"
          >
            {outerStageVertices.map((vertex, vertexIndex) => (
              <line
                key={GROWTH_AXES[vertexIndex]}
                x1={GROWTH_TRIANGLE_CENTER.x}
                y1={GROWTH_TRIANGLE_CENTER.y}
                x2={vertex.x}
                y2={vertex.y}
              />
            ))}
          </g>
          <polygon
            points={pointsAttribute(initialStageVertices)}
            fill="none"
            stroke="#bfdbfe"
            strokeOpacity={tierAchievedStage === 0 ? (showSeparatedGrowthStats ? 0.42 : 0.34) : 0.16}
            strokeWidth="0.65"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            data-growth-stage-baseline="0"
            aria-hidden="true"
          />
          {hasNextTier
            ? TIER_STAGE_GUIDES.map(({ stage }) => {
                const state = stage < tierAchievedStage
                  ? "passed"
                  : tierAchievedStage > 0 && stage === tierAchievedStage
                    ? "current"
                    : "upcoming";
                const stageVertices = getGrowthStageVertices(stage);
                const guideColor = state === "current" ? "#93c5fd" : state === "passed" ? "#bfdbfe" : "#cbd5e1";
                const guideOpacity = showSeparatedGrowthStats
                  ? state === "current" ? 0.42 : state === "passed" ? 0.28 : 0.2
                  : state === "current" ? 0.55 : state === "passed" ? 0.38 : 0.28;
                return (
                  <g
                    key={stage}
                    data-tier-stage={stage}
                    data-tier-stage-state={state}
                    data-tier-guide-emphasis="background"
                    aria-hidden="true"
                  >
                    <polygon
                      points={pointsAttribute(stageVertices)}
                      fill="none"
                      stroke={guideColor}
                      strokeOpacity={guideOpacity}
                      strokeWidth={state === "current" ? 0.8 : 0.65}
                      strokeDasharray="1.25 5.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    {stageVertices.map((vertex, vertexIndex) => (
                      <circle
                        key={vertexIndex}
                        cx={vertex.x}
                        cy={vertex.y}
                        r={state === "current" ? 0.82 : 0.64}
                        fill={guideColor}
                        fillOpacity={Math.min(0.78, guideOpacity + 0.16)}
                        data-tier-stage-vertex={vertexIndex + 1}
                      />
                    ))}
                  </g>
                );
              })
            : null}
          <polygon
            points={currentTriangle}
            fill={`url(#${id}-frame)`}
            fillOpacity={showSeparatedGrowthStats ? 0.16 : 0.045}
            stroke={`url(#${id}-frame)`}
            strokeOpacity={showSeparatedGrowthStats ? 0.88 : 0.42}
            strokeWidth={showSeparatedGrowthStats ? 1.35 : 1.15}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {currentVertices.map((vertex, vertexIndex) => (
            <circle
              key={GROWTH_AXES[vertexIndex]}
              cx={vertex.x}
              cy={vertex.y}
              r={showSeparatedGrowthStats ? 1.9 : 1.45}
              fill="#60a5fa"
              fillOpacity={showSeparatedGrowthStats ? 0.92 : 0.78}
              data-growth-current-axis={GROWTH_AXES[vertexIndex]}
            />
          ))}
          {presentation === "full" ? (
            <g
              fill="#e0f2fe"
              fontSize="4.8"
              fontWeight="800"
              aria-hidden="true"
              data-growth-axis-labels="vertex-aligned"
            >
              <text x={outerStageVertices[0].x} y={outerStageVertices[0].y - 3.5} textAnchor="middle">
                함께 · {togetherAchievedStage}/3
              </text>
              <text x={outerStageVertices[2].x} y={outerStageVertices[2].y + 8} textAnchor="start">
                이어짐 · {continuityAchievedStage}/3
              </text>
              <text x={outerStageVertices[1].x} y={outerStageVertices[1].y + 8} textAnchor="end">
                운영 · {operationsAchievedStage}/3
              </text>
            </g>
          ) : null}
        </>
      ) : null}

      {showCore ? (
        <>
          <g filter={`url(#${id}-core-shadow)`}>
            <image
              href={gemAssetPath}
              x={gemPosition.x}
              y={gemPosition.y}
              width={gemDiameter}
              height={gemDiameter}
              preserveAspectRatio="xMidYMid meet"
              data-tier-gem-asset={tierCode}
              data-tier-gem-emphasis={presentation === "full" ? "panel-primary" : "standard"}
              data-tier-gem-size="fixed"
            />
          </g>
          <g
            data-member-triangles="count"
            data-member-triangle-count={memberTriangleCount}
            aria-hidden="true"
          >
            {MEMBER_TRIANGLE_SLOTS.slice(0, memberTriangleCount).map((slotIndex) => {
              const triangleX = 60 + (slotIndex - (memberTriangleCount - 1) / 2) * MEMBER_TRIANGLE_SPACING;
              return (
                <path
                  key={slotIndex}
                  d={MEMBER_TRIANGLE_PATH}
                  transform={`translate(${triangleX} ${memberTriangleRowY})`}
                  fill={palette.light}
                  fillOpacity="0.88"
                  stroke={GEM_SHADOW_COLOR}
                  strokeOpacity="0.8"
                  strokeWidth="0.85"
                  strokeLinejoin="round"
                  paintOrder="stroke fill"
                  vectorEffect="non-scaling-stroke"
                  data-member-triangle={slotIndex + 1}
                />
              );
            })}
          </g>
          <g
            data-activity-sparkles="count"
            data-activity-sparkle-count={activitySparkleCount}
            aria-hidden="true"
          >
            {ACTIVITY_SPARKLE_POSITIONS.slice(0, activitySparkleCount).map((sparkle, index) => {
              const sparkleX = 60 + sparkleOrbitRadius * sparkle.xFactor;
              const sparkleY = 64 + sparkleOrbitRadius * sparkle.yFactor;
              return (
                <g key={index} transform={`translate(${sparkleX} ${sparkleY})`}>
                  <motion.path
                    d={ACTIVITY_SPARKLE_PATH}
                    fill={palette.highlight}
                    stroke={GEM_SHADOW_COLOR}
                    strokeOpacity="0.76"
                    strokeWidth="0.72"
                    initial={false}
                    animate={shouldAnimateSparkles
                      ? { opacity: [0.48, 1, 0.48], rotate: [0, 14, 0], scale: [sparkle.scale * 0.84, sparkle.scale * 1.14, sparkle.scale * 0.84] }
                      : { opacity: 0.88, rotate: 0, scale: sparkle.scale }}
                    transition={{
                      duration: 2.4,
                      delay: index * 0.26,
                      repeat: shouldAnimateSparkles ? Number.POSITIVE_INFINITY : 0,
                      ease: "easeInOut",
                    }}
                    style={{ transformBox: "fill-box", transformOrigin: "center" }}
                    paintOrder="stroke fill"
                    vectorEffect="non-scaling-stroke"
                    data-activity-sparkle={index + 1}
                  />
                </g>
              );
            })}
          </g>
        </>
      ) : null}
    </svg>
  );
}
