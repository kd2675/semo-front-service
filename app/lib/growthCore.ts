import type { ClubGrowthCore } from "@/app/lib/clubs";

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

export function clampGrowthProgress(value: number | undefined): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value ?? 0));
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

export function getTierTransitionStage(progress: number): TierTransitionStage {
  const normalizedProgress = clampGrowthProgress(progress);
  if (normalizedProgress >= TIER_STAGE_GUIDES[1].threshold) {
    return 3;
  }
  if (normalizedProgress >= TIER_STAGE_GUIDES[0].threshold) {
    return 2;
  }
  return 1;
}
