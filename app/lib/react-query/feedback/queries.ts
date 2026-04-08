import { queryOptions } from "@tanstack/react-query";
import {
  getClubAdminFeedback,
  getClubAdminFeedbackDetail,
  getClubFeedbackDetail,
  getClubFeedbackHome,
} from "@/app/lib/clubs";
import { getApiDataOrFallback, requireApiData } from "@/app/lib/query-utils";

export const feedbackQueryKeys = {
  feedbackHome: (clubId: string) => ["semo", "clubs", clubId, "feedback-home"] as const,
  feedbackDetail: (clubId: string, feedbackId: string | number) =>
    ["semo", "clubs", clubId, "feedback-detail", feedbackId] as const,
  adminFeedbackHome: (clubId: string) => ["semo", "clubs", clubId, "admin-feedback-home"] as const,
  adminFeedbackDetail: (clubId: string, feedbackId: string | number) =>
    ["semo", "clubs", clubId, "admin-feedback-detail", feedbackId] as const,
};

export function feedbackHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: feedbackQueryKeys.feedbackHome(clubId),
    queryFn: async () =>
      requireApiData(await getClubFeedbackHome(clubId), "피드백을 불러오지 못했습니다."),
  });
}

export function feedbackDetailQueryOptions(clubId: string, feedbackId: string | number) {
  return queryOptions({
    queryKey: feedbackQueryKeys.feedbackDetail(clubId, feedbackId),
    queryFn: async () =>
      requireApiData(
        await getClubFeedbackDetail(clubId, feedbackId),
        "피드백 상세를 불러오지 못했습니다.",
      ),
  });
}

export function feedbackDetailFallbackQueryOptions(clubId: string, feedbackId: string | number) {
  return queryOptions({
    queryKey: feedbackQueryKeys.feedbackDetail(clubId, feedbackId),
    queryFn: async () =>
      getApiDataOrFallback(await getClubFeedbackDetail(clubId, feedbackId), null),
  });
}

export function adminFeedbackHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: feedbackQueryKeys.adminFeedbackHome(clubId),
    queryFn: async () =>
      requireApiData(await getClubAdminFeedback(clubId), "피드백을 불러오지 못했습니다."),
  });
}

export function adminFeedbackDetailQueryOptions(clubId: string, feedbackId: string | number) {
  return queryOptions({
    queryKey: feedbackQueryKeys.adminFeedbackDetail(clubId, feedbackId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminFeedbackDetail(clubId, feedbackId),
        "피드백 상세를 불러오지 못했습니다.",
      ),
  });
}

export function adminFeedbackDetailFallbackQueryOptions(
  clubId: string,
  feedbackId: string | number,
) {
  return queryOptions({
    queryKey: feedbackQueryKeys.adminFeedbackDetail(clubId, feedbackId),
    queryFn: async () =>
      getApiDataOrFallback(await getClubAdminFeedbackDetail(clubId, feedbackId), null),
  });
}
