import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { getNotifications, getNotificationSummary } from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const notificationQueryKeys = {
  all: ["semo", "notifications"] as const,
  summary: () => ["semo", "notifications", "summary"] as const,
  feed: (unreadOnly: boolean) => ["semo", "notifications", "feed", { unreadOnly }] as const,
};

export function notificationSummaryQueryOptions() {
  return queryOptions({
    queryKey: notificationQueryKeys.summary(),
    queryFn: async () =>
      requireApiData(await getNotificationSummary(), "알림 수를 불러오지 못했습니다."),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function notificationFeedInfiniteQueryOptions(unreadOnly: boolean) {
  return infiniteQueryOptions({
    queryKey: notificationQueryKeys.feed(unreadOnly),
    queryFn: async ({ pageParam }) =>
      requireApiData(
        await getNotifications({ unreadOnly, beforeId: pageParam, size: 20 }),
        "알림을 불러오지 못했습니다.",
      ),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.hasNext ? lastPage.nextCursor : undefined,
  });
}
