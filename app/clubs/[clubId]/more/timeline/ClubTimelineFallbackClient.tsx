"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubTimeline, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubTimelineClient } from "./ClubTimelineClient";

type ClubTimelineFallbackClientProps = {
  clubId: string;
};

export function ClubTimelineFallbackClient({
  clubId,
}: ClubTimelineFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const { data: timeline, isError: timelineError } = useQuery({
    queryKey: clubKeys.timeline(clubId),
    queryFn: () => unwrap(getClubTimeline(clubId)),
  });

  useEffect(() => {
    if (clubError || timelineError) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [clubError, timelineError, clubId, router]);

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
