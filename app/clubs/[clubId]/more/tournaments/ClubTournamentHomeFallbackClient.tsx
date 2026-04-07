"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  getClubAdminTournamentHome,
  getClubTournamentHome,
  type ClubAdminTournamentHomeResponse,
  type ClubTournamentHomeResponse,
} from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
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

  const { data: payload, isError, refetch } = useQuery<
    ClubTournamentHomeResponse | ClubAdminTournamentHomeResponse
  >({
    queryKey: clubKeys.tournament.home(clubId, mode),
    queryFn: () =>
      mode === "admin"
        ? unwrap(getClubAdminTournamentHome(clubId))
        : unwrap(getClubTournamentHome(clubId)),
  });

  useEffect(() => {
    if (isError) {
      router.replace(mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`);
    }
  }, [isError, mode, clubId, router]);

  if (!payload) {
    return <ClubBoardFeedLoadingShell />;
  }

  return (
    <ClubTournamentHomeClient
      clubId={clubId}
      payload={payload}
      mode={mode}
      onReload={() => void refetch()}
    />
  );
}
