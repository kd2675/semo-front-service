import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  type ClubAdminActivityFeedResponse,
  type ClubTimelineResponse,
  getClubAdminActivities,
  getClubAdminTimeline,
  getClubTimeline,
} from "@/app/lib/clubs";
import { getApiDataOrFallback, requireApiData } from "@/app/lib/queryUtils";

export const activityQueryKeys = {
  adminActivities: (clubId: string, size: number) =>
    ["semo", "clubs", clubId, "admin-activities", { size }] as const,
  timeline: (clubId: string) => ["semo", "clubs", clubId, "timeline"] as const,
  timelineInfinite: (clubId: string, size: number) =>
    ["semo", "clubs", clubId, "timeline", { size }] as const,
  adminTimeline: (clubId: string) => ["semo", "clubs", clubId, "admin-timeline"] as const,
};

export function adminActivitiesQueryOptions(clubId: string, size: number) {
  return queryOptions({
    queryKey: activityQueryKeys.adminActivities(clubId, size),
    queryFn: async () =>
      requireApiData(
        await getClubAdminActivities(clubId, { size }),
        "활동 로그를 불러오지 못했습니다.",
      ),
  });
}

export function adminActivitiesPreviewQueryOptions(clubId: string, size: number) {
  return queryOptions({
    queryKey: activityQueryKeys.adminActivities(clubId, size),
    queryFn: async () =>
      getApiDataOrFallback(await getClubAdminActivities(clubId, { size }), {
        clubId: Number(clubId),
        clubName: "",
        activities: [],
        nextCursorCreatedAt: null,
        nextCursorActivityId: null,
        hasNext: false,
      }),
  });
}

export function adminActivitiesInfiniteQueryOptions(
  clubId: string,
  initialData: ClubAdminActivityFeedResponse,
) {
  return infiniteQueryOptions({
    queryKey: activityQueryKeys.adminActivities(clubId, 20),
    queryFn: async ({ pageParam }) =>
      requireApiData(
        await getClubAdminActivities(clubId, {
          size: 20,
          cursorCreatedAt: pageParam.createdAt,
          cursorActivityId: pageParam.activityId,
        }),
        "활동 로그를 불러오지 못했습니다.",
      ),
    initialPageParam: {
      createdAt: null as string | null,
      activityId: null as number | null,
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNext
        ? {
            createdAt: lastPage.nextCursorCreatedAt,
            activityId: lastPage.nextCursorActivityId,
          }
        : undefined,
    initialData: {
      pages: [initialData],
      pageParams: [{ createdAt: null, activityId: null }],
    },
  });
}

export function timelineQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: activityQueryKeys.timeline(clubId),
    queryFn: async () =>
      requireApiData(await getClubTimeline(clubId), "타임라인을 불러오지 못했습니다."),
  });
}

export function timelineInfiniteQueryOptions(
  clubId: string,
  initialData: ClubTimelineResponse,
) {
  return infiniteQueryOptions({
    queryKey: activityQueryKeys.timelineInfinite(clubId, 12),
    queryFn: async ({ pageParam }) =>
      requireApiData(
        await getClubTimeline(clubId, {
          cursorCreatedAt: pageParam.createdAt,
          cursorActivityId: pageParam.activityId,
          size: 12,
        }),
        "타임라인을 불러오지 못했습니다.",
      ),
    initialPageParam: {
      createdAt: null as string | null,
      activityId: null as number | null,
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasNext
        ? {
            createdAt: lastPage.nextCursorCreatedAt,
            activityId: lastPage.nextCursorActivityId,
          }
        : undefined,
    initialData: {
      pages: [initialData],
      pageParams: [{ createdAt: null, activityId: null }],
    },
  });
}

export function adminTimelineQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: activityQueryKeys.adminTimeline(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminTimeline(clubId),
        "관리자 타임라인을 불러오지 못했습니다.",
      ),
  });
}
