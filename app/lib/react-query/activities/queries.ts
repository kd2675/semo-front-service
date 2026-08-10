import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import {
  type ClubAdminActivityFeedResponse,
  type ClubMemberActivityResponse,
  getClubAdminActivities,
  getClubMemberActivity,
} from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const activityQueryKeys = {
  adminActivities: (clubId: string, size: number, positionId: number | null = null) =>
    ["semo", "clubs", clubId, "admin-activities", { size, positionId }] as const,
  adminActivitiesInfinite: (clubId: string, size: number, positionId: number | null = null) =>
    ["semo", "clubs", clubId, "admin-activities-infinite", { size, positionId }] as const,
  memberActivity: (clubId: string) => ["semo", "clubs", clubId, "member-activity"] as const,
  memberActivityInfinite: (clubId: string, size: number) =>
    ["semo", "clubs", clubId, "member-activity", { size }] as const,
};

export function adminActivitiesQueryOptions(clubId: string, size: number, positionId: number | null = null) {
  return queryOptions({
    queryKey: activityQueryKeys.adminActivities(clubId, size, positionId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminActivities(clubId, { size, positionId }),
        "활동 로그를 불러오지 못했습니다.",
      ),
  });
}

export function adminActivitiesPreviewQueryOptions(clubId: string, size: number) {
  return queryOptions({
    queryKey: activityQueryKeys.adminActivities(clubId, size),
    queryFn: async () =>
      requireApiData(
        await getClubAdminActivities(clubId, { size }),
        "최근 활동을 불러오지 못했습니다.",
      ),
  });
}

export function adminActivitiesInfiniteQueryOptions(
  clubId: string,
  initialData: ClubAdminActivityFeedResponse,
  positionId: number | null = null,
) {
  const options = infiniteQueryOptions({
    queryKey: activityQueryKeys.adminActivitiesInfinite(clubId, 20, positionId),
    queryFn: async ({ pageParam }) =>
      requireApiData(
        await getClubAdminActivities(clubId, {
          size: 20,
          cursorCreatedAt: pageParam.createdAt,
          cursorActivityId: pageParam.activityId,
          positionId,
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
  });
  return positionId == null
    ? {
        ...options,
        initialData: {
          pages: [initialData],
          pageParams: [{ createdAt: null, activityId: null }],
        },
      }
    : options;
}

export function memberActivityQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: activityQueryKeys.memberActivity(clubId),
    queryFn: async () =>
      requireApiData(await getClubMemberActivity(clubId), "활동 기록을 불러오지 못했습니다."),
  });
}

export function memberActivityInfiniteQueryOptions(
  clubId: string,
  initialData: ClubMemberActivityResponse,
) {
  return infiniteQueryOptions({
    queryKey: activityQueryKeys.memberActivityInfinite(clubId, 12),
    queryFn: async ({ pageParam }) =>
      requireApiData(
        await getClubMemberActivity(clubId, {
          cursorCreatedAt: pageParam.createdAt,
          cursorActivityId: pageParam.activityId,
          size: 12,
        }),
        "활동 기록을 불러오지 못했습니다.",
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
