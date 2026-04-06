import koreaRegions from "@/app/lib/korea-regions.json";

export type RegionScope = "OFFLINE" | "ONLINE" | "NATIONWIDE";

export type KoreaRegionDepth2 = {
  depth2Code: string;
  depth2Name: string;
};

export type KoreaRegionDepth1 = {
  depth1Code: string;
  depth1Name: string;
  depth2List: KoreaRegionDepth2[];
};

export const REGION_SCOPE_OPTIONS: Array<{
  value: RegionScope;
  label: string;
  description: string;
}> = [
  { value: "OFFLINE", label: "오프라인", description: "실제 모임 권역을 선택합니다." },
  { value: "ONLINE", label: "온라인", description: "온라인 중심으로 활동하는 모임입니다." },
  { value: "NATIONWIDE", label: "전국", description: "지역 제한 없이 활동하는 모임입니다." },
];

export const KOREA_REGIONS = koreaRegions as KoreaRegionDepth1[];

const depth1ByCode = new Map(KOREA_REGIONS.map((region) => [region.depth1Code, region]));

export function getRegionDepth1(regionDepth1Code: string | null | undefined) {
  if (!regionDepth1Code) {
    return null;
  }
  return depth1ByCode.get(regionDepth1Code) ?? null;
}

export function getRegionDepth2List(regionDepth1Code: string | null | undefined) {
  return getRegionDepth1(regionDepth1Code)?.depth2List ?? [];
}

export function getRegionDepth2(
  regionDepth1Code: string | null | undefined,
  regionDepth2Code: string | null | undefined,
) {
  if (!regionDepth2Code) {
    return null;
  }
  return getRegionDepth2List(regionDepth1Code).find((region) => region.depth2Code === regionDepth2Code) ?? null;
}

export function getRegionNames(
  regionDepth1Code: string | null | undefined,
  regionDepth2Code: string | null | undefined,
) {
  const depth1 = getRegionDepth1(regionDepth1Code);
  const depth2 = getRegionDepth2(regionDepth1Code, regionDepth2Code);
  return {
    regionDepth1Name: depth1?.depth1Name ?? null,
    regionDepth2Name: depth2?.depth2Name ?? null,
  };
}

export function getRegionLabel(
  regionScope: RegionScope,
  regionDepth1Code: string | null | undefined,
  regionDepth2Code: string | null | undefined,
) {
  if (regionScope === "ONLINE") {
    return "온라인";
  }
  if (regionScope === "NATIONWIDE") {
    return "전국";
  }

  const { regionDepth1Name, regionDepth2Name } = getRegionNames(regionDepth1Code, regionDepth2Code);
  if (!regionDepth1Name) {
    return null;
  }
  return [regionDepth1Name, regionDepth2Name].filter(Boolean).join(" ");
}
