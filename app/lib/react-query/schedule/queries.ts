import { queryOptions } from "@tanstack/react-query";
import {
  getClubScheduleAttendanceSummary,
  getClubSchedule,
  getClubScheduleEventAttendance,
  getClubScheduleEventDetail,
  getClubScheduleVoteDetail,
} from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const scheduleQueryKeys = {
  schedule: (clubId: string, year: number, month: number) =>
    ["semo", "clubs", clubId, "schedule", year, month] as const,
  scheduleEventDetail: (clubId: string, eventId: string | number) =>
    ["semo", "clubs", clubId, "schedule-event-detail", eventId] as const,
  scheduleAttendanceSummary: (clubId: string) =>
    ["semo", "clubs", clubId, "schedule-attendance-summary"] as const,
  scheduleEventAttendance: (clubId: string, eventId: string | number) =>
    ["semo", "clubs", clubId, "schedule-event-attendance", eventId] as const,
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

export function scheduleAttendanceSummaryQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: scheduleQueryKeys.scheduleAttendanceSummary(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubScheduleAttendanceSummary(clubId),
        "일정 출석 요약을 불러오지 못했습니다.",
      ),
  });
}

export function scheduleEventAttendanceQueryOptions(
  clubId: string,
  eventId: string | number,
) {
  return queryOptions({
    queryKey: scheduleQueryKeys.scheduleEventAttendance(clubId, eventId),
    queryFn: async () =>
      requireApiData(
        await getClubScheduleEventAttendance(clubId, eventId),
        "일정 출석 현황을 불러오지 못했습니다.",
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
