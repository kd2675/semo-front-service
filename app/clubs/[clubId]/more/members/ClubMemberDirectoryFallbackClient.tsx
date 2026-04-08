"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { memberDirectoryQueryOptions } from "@/app/lib/react-query/members/queries";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubMemberDirectoryClient } from "./ClubMemberDirectoryClient";

type ClubMemberDirectoryFallbackClientProps = {
  clubId: string;
};

export function ClubMemberDirectoryFallbackClient({
  clubId,
}: ClubMemberDirectoryFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, directoryQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), memberDirectoryQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const directory = directoryQuery.data ?? null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !directoryQuery.isPending &&
      (clubQuery.isError || directoryQuery.isError || !club || !directory)
    ) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    directory,
    directoryQuery.isError,
    directoryQuery.isPending,
    router,
  ]);

  if (!club || !directory) {
    return <ClubTimelineLoadingShell />;
  }

  return (
    <ClubMemberDirectoryClient
      clubId={clubId}
      initialData={directory}
      isAdmin={club.admin}
    />
  );
}
