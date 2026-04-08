"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminTimelineQueryOptions } from "@/app/lib/react-query/activities/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { AdminTimelineLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminTimelineClient } from "./ClubAdminTimelineClient";

type ClubAdminTimelineFallbackClientProps = {
  clubId: string;
};

export function ClubAdminTimelineFallbackClient({
  clubId,
}: ClubAdminTimelineFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, timelineQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminTimelineQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const timeline = timelineQuery.data ?? null;

  useEffect(() => {
    if (!clubQuery.isPending && (clubQuery.isError || !club || !club.admin)) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [club, clubId, clubQuery.isError, clubQuery.isPending, router]);

  useEffect(() => {
    if (!timelineQuery.isPending && timelineQuery.isError) {
        router.replace(`/clubs/${clubId}/admin`);
    }
  }, [clubId, router, timelineQuery.isError, timelineQuery.isPending]);

  if (!club || !timeline) {
    return <AdminTimelineLoadingShell />;
  }

  return <ClubAdminTimelineClient clubId={clubId} initialData={timeline} />;
}
