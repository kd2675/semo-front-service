import { queryOptions } from "@tanstack/react-query";
import { getDiscoverClubs, getMyClubs } from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const homeQueryKeys = {
  myClubs: () => ["semo", "my-clubs"] as const,
  discoverClubs: (query: string) => ["semo", "discover-clubs", query] as const,
};

export function myClubsQueryOptions() {
  return queryOptions({
    queryKey: homeQueryKeys.myClubs(),
    queryFn: async () =>
      requireApiData(await getMyClubs(), "내 클럽을 불러오지 못했습니다."),
  });
}

export function discoverClubsQueryOptions(query: string) {
  return queryOptions({
    queryKey: homeQueryKeys.discoverClubs(query),
    queryFn: async () =>
      requireApiData(
        await getDiscoverClubs(query),
        "클럽 탐색 목록을 불러오지 못했습니다.",
      ),
    gcTime: 0,
  });
}
