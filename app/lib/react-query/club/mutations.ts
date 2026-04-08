import { mutationOptions } from "@tanstack/react-query";
import {
  updateClubDashboardWidgets,
  updateClubFeatures,
  updateClubProfile,
  updateClubSettings,
  type DashboardScope,
  type ClubDashboardWidgetSummary,
} from "@/app/lib/clubs";

export function updateClubFeaturesMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (enabledFeatureKeys: string[]) =>
      updateClubFeatures(clubId, { enabledFeatureKeys }),
  });
}

export function persistFeatureOrderMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: async (nextOrderedFeatures: Array<{ featureKey: string }>) => {
      const result = await updateClubFeatures(clubId, {
        enabledFeatureKeys: nextOrderedFeatures.map((feature) => feature.featureKey),
      });

      if (!result.ok || !result.data) {
        throw new Error(result.message ?? "순서 저장에 실패했습니다.");
      }

      return result.data;
    },
  });
}

export function updateClubSettingsMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof updateClubSettings>[1]) =>
      updateClubSettings(clubId, request),
  });
}

export function updateClubProfileMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof updateClubProfile>[1]) =>
      updateClubProfile(clubId, request),
  });
}

export function updateDashboardWidgetsMutationOptions(clubId: string, pageKey: DashboardScope) {
  return mutationOptions({
    mutationFn: (widgets: ClubDashboardWidgetSummary[]) =>
      updateClubDashboardWidgets(clubId, {
        scope: pageKey,
        widgets: widgets.map((widget) => ({
          widgetKey: widget.widgetKey,
          enabled: widget.enabled,
          sortOrder: widget.sortOrder,
          columnSpan: widget.columnSpan,
          rowSpan: widget.rowSpan,
        })),
      }),
  });
}
