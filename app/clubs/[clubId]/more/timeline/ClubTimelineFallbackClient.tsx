"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubTimeline,
  getMyClub,
  type ClubTimelineResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubTimelineClient } from "./ClubTimelineClient";

type ClubTimelineFallbackClientProps = {
  clubId: string;
};

export function ClubTimelineFallbackClient({
  clubId,
}: ClubTimelineFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [timeline, setTimeline] = useState<ClubTimelineResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, timelineResult] = await Promise.all([
        getMyClub(clubId),
        getClubTimeline(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !timelineResult.ok || !timelineResult.data) {
        router.replace(`/clubs/${clubId}`);
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
