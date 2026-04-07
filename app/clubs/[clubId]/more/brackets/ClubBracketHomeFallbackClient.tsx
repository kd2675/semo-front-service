"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  getClubAdminBracketHome,
  getClubBracketHome,
  type ClubAdminBracketHomeResponse,
  type ClubBracketHomeResponse,
} from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
import { ClubBoardFeedLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubBracketHomeClient } from "./ClubBracketHomeClient";

type ClubBracketHomeFallbackClientProps = {
  clubId: string;
  mode?: "user" | "admin";
};

export function ClubBracketHomeFallbackClient({
  clubId,
  mode = "user",
}: ClubBracketHomeFallbackClientProps) {
  const router = useRouter();

  const { data: payload, isError } = useQuery<
    ClubBracketHomeResponse | ClubAdminBracketHomeResponse
  >({
    queryKey: clubKeys.bracket.home(clubId, mode),
    queryFn: () =>
      mode === "admin"
        ? unwrap(getClubAdminBracketHome(clubId))
        : unwrap(getClubBracketHome(clubId)),
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
    <ClubBracketHomeClient
      clubId={clubId}
      payload={payload}
      mode={mode}
    />
  );
}
