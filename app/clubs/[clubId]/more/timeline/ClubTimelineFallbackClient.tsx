"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { timelineQueryOptions } from "@/app/lib/react-query/activities/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubTimelineClient } from "./ClubTimelineClient";

type ClubTimelineFallbackClientProps = {
  clubId: string;
};

export function ClubTimelineFallbackClient({
  clubId,
}: ClubTimelineFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, timelineQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), timelineQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const timeline = timelineQuery.data ?? null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !timelineQuery.isPending &&
      (clubQuery.isError || timelineQuery.isError || !club || !timeline)
    ) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    router,
    timeline,
    timelineQuery.isError,
    timelineQuery.isPending,
  ]);

  if (!club || !timeline) {
    return <ClubTimelineLoadingShell />;
  }

  return (
    <ClubTimelineClient
      clubId={clubId}
      initialData={timeline}
      isAdmin={club.admin}
    />
  );
}
