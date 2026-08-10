"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import {
  adminTournamentHomeQueryOptions,
  tournamentHomeQueryOptions,
  tournamentQueryKeys,
} from "@/app/lib/react-query/tournaments/queries";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { clubFeaturesQueryOptions } from "@/app/lib/react-query/club/queries";
import { ClubDataLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubTournamentHomeClient } from "./clients/ClubTournamentHomeClient";

type ClubTournamentHomeFallbackClientProps = {
  clubId: string;
  mode?: "user" | "admin";
};

export function ClubTournamentHomeFallbackClient({
  clubId,
  mode = "user",
}: ClubTournamentHomeFallbackClientProps) {
  const queryClient = useQueryClient();
  const isAdminMode = mode === "admin";
  const queryKey =
    isAdminMode
      ? tournamentQueryKeys.adminTournamentHome(clubId)
      : tournamentQueryKeys.tournamentHome(clubId);
  const adminQuery = useQuery({
    ...adminTournamentHomeQueryOptions(clubId),
    enabled: isAdminMode,
  });
  const userQuery = useQuery({
    ...tournamentHomeQueryOptions(clubId),
    enabled: !isAdminMode,
  });
  const featuresQuery = useQuery(clubFeaturesQueryOptions(clubId));
  const payload = isAdminMode ? adminQuery.data : userQuery.data;
  const isPending = isAdminMode ? adminQuery.isPending : userQuery.isPending;
  const isError = isAdminMode ? adminQuery.isError : userQuery.isError;
  const error = isAdminMode ? adminQuery.error : userQuery.error;

  const handleReload = () => {
    void queryClient.invalidateQueries({ queryKey });
  };

  if (isError && !payload) {
    return (
      <ClubRouteErrorState
        title={isAdminMode ? "대회 관리" : "대회"}
        message={getQueryErrorMessage(error, "대회 목록을 불러오지 못했습니다.")}
        backHref={isAdminMode ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`}
        theme={mode}
        onRetry={handleReload}
      />
    );
  }

  if (isPending || !payload) {
    return <ClubDataLoadingShell mode={mode} />;
  }

  return (
    <ClubTournamentHomeClient
      clubId={clubId}
      payload={payload}
      mode={mode}
      bracketEnabled={featuresQuery.data?.some((feature) => feature.featureKey === "BRACKET" && feature.enabled) ?? false}
      onReload={handleReload}
    />
  );
}
