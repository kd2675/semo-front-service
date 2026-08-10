import { queryOptions } from "@tanstack/react-query";

import { getClubHandoverCenter } from "@/app/lib/semo/handover";
import { requireApiData } from "@/app/lib/queryUtils";

export const handoverQueryKeys = {
  all: (clubId: string) => ["semo", "clubs", clubId, "handover"] as const,
  center: (clubId: string, termId?: number | null) =>
    [...handoverQueryKeys.all(clubId), "center", termId ?? "current"] as const,
};

export function handoverCenterQueryOptions(clubId: string, termId?: number | null) {
  return queryOptions({
    queryKey: handoverQueryKeys.center(clubId, termId),
    queryFn: async () =>
      requireApiData(
        await getClubHandoverCenter(clubId, termId),
        "인수인계 센터 정보를 불러오지 못했습니다.",
      ),
  });
}
