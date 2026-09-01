"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import type { ClubGrowthCore } from "@/app/lib/clubs";

type ClubGrowthCoreMarkProps = {
  growthCore?: ClubGrowthCore | null;
  size?: number;
  animateActivity?: boolean;
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

function clampProgress(value: number | undefined) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value ?? 0));
}

function trianglePoint(progress: number, direction: "top" | "right" | "left") {
  const radius = 24 + clampProgress(progress) * 0.27;
  if (direction === "top") {
    return `60,${64 - radius}`;
  }
  const xOffset = radius * 0.866;
  const yOffset = radius * 0.5;
  return direction === "right"
    ? `${60 + xOffset},${64 + yOffset}`
    : `${60 - xOffset},${64 + yOffset}`;
}

function memberCoreRadius(value: number | undefined) {
  const memberCount = Number.isFinite(value) ? Math.max(1, Math.floor(value ?? 0)) : 1;
  if (memberCount <= 1) return 9;
  if (memberCount <= 4) return 11;
  if (memberCount <= 9) return 13;
  if (memberCount <= 19) return 15;
  if (memberCount <= 49) return 17;
  return 19;
}

export function ClubGrowthCoreMark({
  growthCore,
  size = 80,
  animateActivity = false,
  className,
}: ClubGrowthCoreMarkProps) {
  const core = growthCore ?? INITIAL_CORE;
  const prefersReducedMotion = useReducedMotion();
  const id = useId().replaceAll(":", "");
  const palette = MATERIALS[core.tierCode] ?? MATERIALS.RAW;
  const together = clampProgress(core.togetherProgress);
  const operations = clampProgress(core.operationsProgress);
  const continuity = clampProgress(core.continuityProgress);
  const memberCount = Number.isFinite(core.memberCount) ? Math.max(0, Math.floor(core.memberCount)) : 0;
  const activityLevel = Math.max(0, Math.min(4, Math.round(core.activityLevel ?? 0)));
  const coreRadius = memberCoreRadius(memberCount);
  const currentTriangle = [
    trianglePoint(together, "top"),
    trianglePoint(operations, "right"),
    trianglePoint(continuity, "left"),
  ].join(" ");
  const ariaLabel = `${core.tierLabel} 코어. 활성 멤버 ${memberCount}명, 함께 ${together}%, 운영 ${operations}%, 이어짐 ${continuity}%, 최근 활동 밝기 ${activityLevel}단계.`;
  const glowOpacity = 0.12 + activityLevel * 0.12;
  const shouldAnimate = animateActivity && activityLevel > 0 && !prefersReducedMotion;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={ariaLabel}
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

      <polygon
        points="60,14 103.3,89 16.7,89"
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="1.5"
        strokeDasharray="2 5"
        strokeLinecap="round"
      />
      <polygon
        points={currentTriangle}
        fill={`url(#${id}-frame)`}
        fillOpacity="0.1"
        stroke={`url(#${id}-frame)`}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="60" cy={64 - (24 + together * 0.27)} r="2.8" fill="#135bec" />
      <circle cx={60 + (24 + operations * 0.27) * 0.866} cy={64 + (24 + operations * 0.27) * 0.5} r="2.8" fill="#135bec" />
      <circle cx={60 - (24 + continuity * 0.27) * 0.866} cy={64 + (24 + continuity * 0.27) * 0.5} r="2.8" fill="#135bec" />

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

      <g filter={`url(#${id}-core-glow)`}>
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
        <ellipse
          cx={60 - coreRadius * 0.2}
          cy={64 - coreRadius * 0.3}
          rx={Math.max(1.2, coreRadius * 0.18)}
          ry={Math.max(0.8, coreRadius * 0.1)}
          fill="#ffffff"
          opacity={0.28 + activityLevel * 0.1}
        />
      </g>
    </svg>
  );
}
