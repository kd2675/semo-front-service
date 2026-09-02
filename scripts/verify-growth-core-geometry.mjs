import assert from "node:assert/strict";

import {
  getActivitySparkleCount,
  getGrowthAxisPoint,
  getGrowthRadius,
  getGrowthStageVertices,
  getMemberTriangleCount,
  getTierAchievedStage,
  getTierDisplayLabel,
  getTierTransitionProgress,
  GROWTH_AXES,
  TIER_STAGE_GUIDES,
  TIER_STAGE_RADII,
} from "../app/lib/growthCore.ts";

assert.equal(getActivitySparkleCount(undefined), 1);
assert.equal(getActivitySparkleCount(0), 1);
assert.equal(getActivitySparkleCount(1), 2);
assert.equal(getActivitySparkleCount(4), 5);
assert.equal(getActivitySparkleCount(99), 5);
assert.equal(getMemberTriangleCount(undefined), 0);
assert.equal(getMemberTriangleCount(0), 0);
assert.equal(getMemberTriangleCount(1), 1);
assert.equal(getMemberTriangleCount(4), 1);
assert.equal(getMemberTriangleCount(5), 2);
assert.equal(getMemberTriangleCount(19), 2);
assert.equal(getMemberTriangleCount(20), 3);
assert.equal(getMemberTriangleCount(49), 3);
assert.equal(getMemberTriangleCount(50), 4);
assert.equal(getMemberTriangleCount(99), 4);
assert.equal(getMemberTriangleCount(100), 5);
assert.equal(getMemberTriangleCount(1_000), 5);
assert.equal(getTierDisplayLabel(undefined), "첫 티어");
assert.equal(getTierDisplayLabel({ tierCode: "RAW", tierLabel: "원석" }), "첫 티어");
assert.equal(getTierDisplayLabel({ tierCode: "gold", tierLabel: "골드" }), "골드");
assert.equal(getTierDisplayLabel({ tierCode: "CUSTOM", tierLabel: "커스텀" }), "커스텀");

assert.equal(getGrowthRadius(0), TIER_STAGE_RADII[0]);
assert.equal(getGrowthRadius(32), TIER_STAGE_RADII[0]);
assert.equal(getGrowthRadius(33), TIER_STAGE_RADII[1]);
assert.equal(getGrowthRadius(65), TIER_STAGE_RADII[1]);
assert.equal(getGrowthRadius(66), TIER_STAGE_RADII[2]);
assert.equal(getGrowthRadius(99), TIER_STAGE_RADII[2]);
assert.equal(getGrowthRadius(100), TIER_STAGE_RADII[3]);

for (const { stage, threshold } of TIER_STAGE_GUIDES) {
  assert.equal(getGrowthRadius(threshold), TIER_STAGE_RADII[stage]);

  const targetVertices = getGrowthStageVertices(stage);
  GROWTH_AXES.forEach((axis, axisIndex) => {
    assert.deepEqual(
      getGrowthAxisPoint(threshold, axis),
      targetVertices[axisIndex],
      `${stage}단계 ${axis} 현재 달성점이 목표 꼭짓점과 일치해야 합니다.`,
    );
  });
}

const initialVertices = getGrowthStageVertices(0);
assert.equal(
  new Set(initialVertices.map(({ x, y }) => `${x},${y}`)).size,
  3,
  "0단계도 서로 다른 세 꼭짓점을 가진 시작 삼각형이어야 합니다.",
);

for (const [axisIndex, axis] of GROWTH_AXES.entries()) {
  assert.deepEqual(getGrowthAxisPoint(0, axis), initialVertices[axisIndex]);
  assert.deepEqual(getGrowthAxisPoint(32, axis), initialVertices[axisIndex]);
  assert.deepEqual(getGrowthAxisPoint(33, axis), getGrowthAxisPoint(65, axis));
  assert.deepEqual(getGrowthAxisPoint(66, axis), getGrowthAxisPoint(99, axis));
  assert.notDeepEqual(getGrowthAxisPoint(32, axis), getGrowthAxisPoint(33, axis));
  assert.notDeepEqual(getGrowthAxisPoint(65, axis), getGrowthAxisPoint(66, axis));
  assert.notDeepEqual(getGrowthAxisPoint(99, axis), getGrowthAxisPoint(100, axis));
}

assert.equal(getTierTransitionProgress({
  togetherProgress: 76,
  operationsProgress: 58,
  continuityProgress: 69,
}), 58);
assert.equal(getTierAchievedStage(32), 0);
assert.equal(getTierAchievedStage(33), 1);
assert.equal(getTierAchievedStage(65), 1);
assert.equal(getTierAchievedStage(66), 2);
assert.equal(getTierAchievedStage(99), 2);
assert.equal(getTierAchievedStage(100), 3);

console.log("Semo growth-core geometry checks passed.");
