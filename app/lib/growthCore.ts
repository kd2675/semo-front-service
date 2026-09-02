import type { ClubGrowthCore } from "@/app/lib/clubs";

export const DEFAULT_CLUB_GROWTH_CORE: ClubGrowthCore = {
  tierCode: "RAW",
  tierLabel: "첫 티어",
  nextTierCode: "IRON",
  nextTierLabel: "아이언",
  togetherProgress: 0,
  operationsProgress: 0,
  continuityProgress: 0,
  memberCount: 1,
  activityLevel: 0,
  policyVersion: 1,
  lastProjectedAt: null,
};

export const CLUB_GROWTH_TIER_STEPS = [
  { code: "RAW", label: "첫 티어" },
  { code: "IRON", label: "아이언" },
  { code: "BRONZE", label: "브론즈" },
  { code: "SILVER", label: "실버" },
  { code: "GOLD", label: "골드" },
  { code: "PLATINUM", label: "플래티넘" },
  { code: "DIAMOND", label: "다이아" },
] as const;

type GrowthAxes = Pick<
  ClubGrowthCore,
  "togetherProgress" | "operationsProgress" | "continuityProgress"
>;

export const TIER_STAGE_GUIDES = [
  { stage: 1, threshold: 33 },
  { stage: 2, threshold: 66 },
  { stage: 3, threshold: 100 },
] as const;

export type TierTransitionStage = (typeof TIER_STAGE_GUIDES)[number]["stage"];
export type AchievedTierStage = 0 | TierTransitionStage;

export const GROWTH_AXES = ["together", "operations", "continuity"] as const;

export type GrowthAxis = (typeof GROWTH_AXES)[number];

export type GrowthPoint = {
  x: number;
  y: number;
};

export const GROWTH_TRIANGLE_CENTER = { x: 60, y: 64 } as const;

export const TIER_STAGE_RADII: Record<AchievedTierStage, number> = {
  0: 20,
  1: 32,
  2: 44,
  3: 56,
};

const EQUILATERAL_TRIANGLE_X_FACTOR = Math.sqrt(3) / 2;
const GROWTH_AXIS_VECTORS: Record<GrowthAxis, GrowthPoint> = {
  together: { x: 0, y: -1 },
  operations: { x: EQUILATERAL_TRIANGLE_X_FACTOR, y: 0.5 },
  continuity: { x: -EQUILATERAL_TRIANGLE_X_FACTOR, y: 0.5 },
};

export function clampGrowthProgress(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value ?? 0));
}

export function getActivitySparkleCount(activityLevel: number | undefined): number {
  if (!Number.isFinite(activityLevel)) {
    return 1;
  }
  return Math.max(1, Math.min(5, Math.round(activityLevel ?? 0) + 1));
}

export function getMemberTriangleCount(memberCount: number | undefined): number {
  if (!Number.isFinite(memberCount) || (memberCount ?? 0) <= 0) {
    return 0;
  }

  const normalizedMemberCount = Math.floor(memberCount ?? 0);
  if (normalizedMemberCount <= 4) {
    return 1;
  }
  if (normalizedMemberCount <= 19) {
    return 2;
  }
  if (normalizedMemberCount <= 49) {
    return 3;
  }
  if (normalizedMemberCount <= 99) {
    return 4;
  }
  return 5;
}

export function getTierDisplayLabel(
  growthCore?: Pick<ClubGrowthCore, "tierCode" | "tierLabel"> | null,
): string {
  const tierCode = growthCore?.tierCode?.trim().toUpperCase();
  const knownTier = CLUB_GROWTH_TIER_STEPS.find(({ code }) => code === tierCode);

  return knownTier?.label ?? growthCore?.tierLabel?.trim() ?? DEFAULT_CLUB_GROWTH_CORE.tierLabel;
}

export function getTierTransitionProgress(growthCore?: GrowthAxes | null): number {
  if (!growthCore) {
    return 0;
  }

  return Math.min(
    clampGrowthProgress(growthCore.togetherProgress),
    clampGrowthProgress(growthCore.operationsProgress),
    clampGrowthProgress(growthCore.continuityProgress),
  );
}

export function getTierAchievedStage(progress: number): AchievedTierStage {
  const normalizedProgress = clampGrowthProgress(progress);
  if (normalizedProgress >= TIER_STAGE_GUIDES[2].threshold) {
    return 3;
  }
  if (normalizedProgress >= TIER_STAGE_GUIDES[1].threshold) {
    return 2;
  }
  if (normalizedProgress >= TIER_STAGE_GUIDES[0].threshold) {
    return 1;
  }
  return 0;
}

export function getGrowthPointAtRadius(radius: number, axis: GrowthAxis): GrowthPoint {
  const normalizedRadius = Math.max(0, radius);
  const vector = GROWTH_AXIS_VECTORS[axis];

  return {
    x: GROWTH_TRIANGLE_CENTER.x + normalizedRadius * vector.x,
    y: GROWTH_TRIANGLE_CENTER.y + normalizedRadius * vector.y,
  };
}

export function getGrowthRadius(progress: number): number {
  return TIER_STAGE_RADII[getTierAchievedStage(progress)];
}

export function getGrowthAxisPoint(progress: number, axis: GrowthAxis): GrowthPoint {
  return getGrowthPointAtRadius(getGrowthRadius(progress), axis);
}

export function getGrowthStageVertices(stage: AchievedTierStage): GrowthPoint[] {
  const radius = TIER_STAGE_RADII[stage];
  return GROWTH_AXES.map((axis) => getGrowthPointAtRadius(radius, axis));
}
