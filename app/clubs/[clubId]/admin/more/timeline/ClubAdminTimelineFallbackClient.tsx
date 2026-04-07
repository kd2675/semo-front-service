"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubAdminTimeline, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";
import { AdminTimelineLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminTimelineClient } from "./ClubAdminTimelineClient";

type ClubAdminTimelineFallbackClientProps = {
  clubId: string;
};

export function ClubAdminTimelineFallbackClient({
  clubId,
}: ClubAdminTimelineFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: timeline, isError: timelineError } = useQuery({
    queryKey: adminKeys.timeline(clubId),
    queryFn: () => unwrap(getClubAdminTimeline(clubId)),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (clubError || (club && !isAdmin)) {
      router.replace(`/clubs/${clubId}`);
    } else if (timelineError) {
      router.replace(`/clubs/${clubId}/admin`);
    }
  }, [clubError, club, isAdmin, timelineError, clubId, router]);

  if (!club || !timeline) {
    return <AdminTimelineLoadingShell />;
  }

  return <ClubAdminTimelineClient clubId={clubId} initialData={timeline} />;
}
