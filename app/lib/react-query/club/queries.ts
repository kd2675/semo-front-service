import { queryOptions } from "@tanstack/react-query";
import {
  type DashboardScope,
  getClubDashboardWidgetEditor,
  getClubDashboardWidgets,
  getClubFeatures,
  getClubMoreSummary,
  getClubOperationsCatalog,
  getClubProfile,
  getMyClub,
} from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const clubQueryKeys = {
  myClub: (clubId: string) => ["semo", "clubs", clubId, "my-club"] as const,
  features: (clubId: string) => ["semo", "clubs", clubId, "features"] as const,
  moreSummary: (clubId: string) => ["semo", "clubs", clubId, "more-summary"] as const,
  operationsCatalog: (clubId: string) => ["semo", "clubs", clubId, "operations-catalog"] as const,
  profile: (clubId: string) => ["semo", "clubs", clubId, "profile"] as const,
  dashboardWidgetEditor: (clubId: string, pageKey: DashboardScope) =>
    ["semo", "clubs", clubId, "dashboard-widget-editor", pageKey] as const,
  dashboardWidgets: (clubId: string, pageKey: DashboardScope) =>
    ["semo", "clubs", clubId, "dashboard-widgets", pageKey] as const,
  schedule: (clubId: string, activeYear: number, activeMonth: number) =>
    ["semo", "clubs", clubId, "schedule", activeYear, activeMonth] as const,
};

export function myClubQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: clubQueryKeys.myClub(clubId),
    queryFn: async () =>
      requireApiData(await getMyClub(clubId), "클럽 정보를 불러오지 못했습니다."),
  });
}

export function clubFeaturesQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: clubQueryKeys.features(clubId),
    queryFn: async () =>
      requireApiData(await getClubFeatures(clubId), "기능 정보를 불러오지 못했습니다."),
  });
}

export function clubMoreSummaryQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: clubQueryKeys.moreSummary(clubId),
    queryFn: async () =>
      requireApiData(await getClubMoreSummary(clubId), "더보기 운영 정보를 불러오지 못했습니다."),
  });
}

export function clubOperationsCatalogQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: clubQueryKeys.operationsCatalog(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubOperationsCatalog(clubId),
        "운영 프리셋과 템플릿을 불러오지 못했습니다.",
      ),
  });
}

export function clubProfileQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: clubQueryKeys.profile(clubId),
    queryFn: async () =>
      requireApiData(await getClubProfile(clubId), "프로필을 불러오지 못했습니다."),
  });
}

export function dashboardWidgetEditorQueryOptions(clubId: string, pageKey: DashboardScope) {
  return queryOptions({
    queryKey: clubQueryKeys.dashboardWidgetEditor(clubId, pageKey),
    queryFn: async () =>
      requireApiData(
        await getClubDashboardWidgetEditor(clubId, pageKey),
        "위젯 편집 정보를 불러오지 못했습니다.",
      ),
  });
}

export function dashboardWidgetsQueryOptions(clubId: string, pageKey: DashboardScope) {
  return queryOptions({
    queryKey: clubQueryKeys.dashboardWidgets(clubId, pageKey),
    queryFn: async () =>
      requireApiData(
        await getClubDashboardWidgets(clubId, pageKey),
        "홈 위젯을 불러오지 못했습니다.",
      ),
  });
}
