import { queryOptions } from "@tanstack/react-query";
import {
  getClubSchedule,
  getClubScheduleEventDetail,
  getClubScheduleHome,
  getClubScheduleVoteDetail,
} from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/query-utils";

export const scheduleQueryKeys = {
  schedule: (clubId: string, year: number, month: number) =>
    ["semo", "clubs", clubId, "schedule", year, month] as const,
  scheduleHome: (clubId: string) => ["semo", "clubs", clubId, "schedule-home"] as const,
  scheduleEventDetail: (clubId: string, eventId: string | number) =>
    ["semo", "clubs", clubId, "schedule-event-detail", eventId] as const,
  scheduleVoteDetail: (clubId: string, voteId: string | number) =>
    ["semo", "clubs", clubId, "schedule-vote-detail", voteId] as const,
};

export function clubScheduleQueryOptions(
  clubId: string,
  activeYear: number,
  activeMonth: number,
) {
  return queryOptions({
    queryKey: scheduleQueryKeys.schedule(clubId, activeYear, activeMonth),
    queryFn: async () =>
      requireApiData(
        await getClubSchedule(clubId, { year: activeYear, month: activeMonth }),
        "일정 정보를 불러오지 못했습니다.",
      ),
    placeholderData: (previousData) => previousData,
  });
}

export function scheduleHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: scheduleQueryKeys.scheduleHome(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubScheduleHome(clubId),
        "일정 정보를 불러오지 못했습니다.",
      ),
  });
}

export function scheduleEventDetailQueryOptions(clubId: string, eventId: string | number) {
  return queryOptions({
    queryKey: scheduleQueryKeys.scheduleEventDetail(clubId, eventId),
    queryFn: async () =>
      requireApiData(
        await getClubScheduleEventDetail(clubId, eventId),
        "일정 상세를 불러오지 못했습니다.",
      ),
  });
}

export function scheduleVoteDetailQueryOptions(clubId: string, voteId: string | number) {
  return queryOptions({
    queryKey: scheduleQueryKeys.scheduleVoteDetail(clubId, voteId),
    queryFn: async () =>
      requireApiData(
        await getClubScheduleVoteDetail(clubId, voteId),
        "투표 상세를 불러오지 못했습니다.",
      ),
  });
}
