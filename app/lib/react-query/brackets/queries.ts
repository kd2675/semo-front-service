import { queryOptions } from "@tanstack/react-query";
import { getClubAdminBracketHome, getClubBracketDetail, getClubBracketHome } from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const bracketQueryKeys = {
  bracketHome: (clubId: string) => ["semo", "clubs", clubId, "bracket-home"] as const,
  adminBracketHome: (clubId: string) => ["semo", "clubs", clubId, "admin-bracket-home"] as const,
  bracketDetail: (clubId: string, bracketRecordId: string | number) =>
    ["semo", "clubs", clubId, "bracket-detail", bracketRecordId] as const,
};

export function bracketHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: bracketQueryKeys.bracketHome(clubId),
    queryFn: async () =>
      requireApiData(await getClubBracketHome(clubId), "대진표 정보를 불러오지 못했습니다."),
  });
}

export function adminBracketHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: bracketQueryKeys.adminBracketHome(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminBracketHome(clubId),
        "대진표 정보를 불러오지 못했습니다.",
      ),
  });
}

export function bracketDetailQueryOptions(clubId: string, bracketRecordId: string | number) {
  return queryOptions({
    queryKey: bracketQueryKeys.bracketDetail(clubId, bracketRecordId),
    queryFn: async () =>
      requireApiData(
        await getClubBracketDetail(clubId, bracketRecordId),
        "대진표 상세를 불러오지 못했습니다.",
      ),
  });
}
