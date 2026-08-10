import { queryOptions } from "@tanstack/react-query";

import { getClubDecisionAdminCenter, getClubDecisionLog } from "@/app/lib/semo/decision";

export const decisionQueryKeys = {
  all: (clubId: string) => ["club", clubId, "decisions"] as const,
  member: (clubId: string) => [...decisionQueryKeys.all(clubId), "member"] as const,
  admin: (clubId: string) => [...decisionQueryKeys.all(clubId), "admin"] as const,
};

export const memberDecisionLogQueryOptions = (clubId: string) => queryOptions({
  queryKey: decisionQueryKeys.member(clubId),
  queryFn: async () => {
    const result = await getClubDecisionLog(clubId);
    if (!result.ok || !result.data) throw new Error(result.message ?? "회의록·결정을 불러오지 못했습니다.");
    return result.data;
  },
});

export const adminDecisionCenterQueryOptions = (clubId: string) => queryOptions({
  queryKey: decisionQueryKeys.admin(clubId),
  queryFn: async () => {
    const result = await getClubDecisionAdminCenter(clubId);
    if (!result.ok || !result.data) throw new Error(result.message ?? "회의록·결정 운영 정보를 불러오지 못했습니다.");
    return result.data;
  },
});
