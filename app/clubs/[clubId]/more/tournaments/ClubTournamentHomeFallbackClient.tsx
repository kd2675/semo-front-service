"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  adminTournamentHomeQueryOptions,
  tournamentHomeQueryOptions,
  tournamentQueryKeys,
} from "@/app/lib/react-query/tournaments/queries";
import { ClubBoardFeedLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubTournamentHomeClient } from "./ClubTournamentHomeClient";

type ClubTournamentHomeFallbackClientProps = {
  clubId: string;
  mode?: "user" | "admin";
};

export function ClubTournamentHomeFallbackClient({
  clubId,
  mode = "user",
}: ClubTournamentHomeFallbackClientProps) {
  const router = useRouter();
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
  const payload = isAdminMode ? adminQuery.data : userQuery.data;
  const isPending = isAdminMode ? adminQuery.isPending : userQuery.isPending;
  const isFetching = isAdminMode ? adminQuery.isFetching : userQuery.isFetching;
  const isError = isAdminMode ? adminQuery.isError : userQuery.isError;

  useEffect(() => {
    if (!isPending && isError) {
      router.replace(isAdminMode ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`);
    }
  }, [clubId, isAdminMode, isError, isPending, router]);

  const handleReload = () => {
    void queryClient.invalidateQueries({ queryKey });
  };

  if (isPending || isFetching || !payload) {
    return <ClubBoardFeedLoadingShell />;
  }

  return (
    <ClubTournamentHomeClient
      clubId={clubId}
      payload={payload}
      mode={mode}
      onReload={handleReload}
    />
  );
}
