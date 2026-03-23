"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminActivities,
  getMyClub,
  type ClubAdminActivityFeedResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { AdminHomeLoadingShell } from "../AdminRouteLoadingShells";
import { ClubAdminLogsClient } from "./ClubAdminLogsClient";

type ClubAdminLogsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminLogsFallbackClient({ clubId }: ClubAdminLogsFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [initialData, setInitialData] = useState<ClubAdminActivityFeedResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, logsResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminActivities(clubId, { size: 20 }),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!logsResult.ok || !logsResult.data) {
        router.replace(`/clubs/${clubId}/admin`);
        return;
      }

      setClub(clubResult.data);
      setInitialData(logsResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !initialData) {
    return <AdminHomeLoadingShell />;
  }

  return <ClubAdminLogsClient clubId={clubId} clubName={club.name} initialData={initialData} />;
}
