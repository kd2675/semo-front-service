"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminTimeline,
  getMyClub,
  type ClubAdminTimelineResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { AdminTimelineLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminTimelineClient } from "./ClubAdminTimelineClient";

type ClubAdminTimelineFallbackClientProps = {
  clubId: string;
};

export function ClubAdminTimelineFallbackClient({
  clubId,
}: ClubAdminTimelineFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [timeline, setTimeline] = useState<ClubAdminTimelineResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, timelineResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminTimeline(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!timelineResult.ok || !timelineResult.data) {
        router.replace(`/clubs/${clubId}/admin`);
        return;
      }

      setClub(clubResult.data);
      setTimeline(timelineResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !timeline) {
    return <AdminTimelineLoadingShell />;
  }

  return <ClubAdminTimelineClient clubId={clubId} initialData={timeline} />;
}
