"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminDues,
  getClubAdminDuesCharges,
  getMyClub,
  type ClubAdminDuesChargeFeedResponse,
  type ClubAdminDuesHomeResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubAdminDuesClient } from "./ClubAdminDuesClient";
import { AdminAttendanceLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminDuesFallbackClientProps = {
  clubId: string;
};

export function ClubAdminDuesFallbackClient({ clubId }: ClubAdminDuesFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [dues, setDues] = useState<ClubAdminDuesHomeResponse | null>(null);
  const [chargeFeed, setChargeFeed] = useState<ClubAdminDuesChargeFeedResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, duesResult, chargeFeedResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminDues(clubId),
        getClubAdminDuesCharges(clubId, { size: 10 }),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }
      if (!duesResult.ok || !duesResult.data || !chargeFeedResult.ok || !chargeFeedResult.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      setClub(clubResult.data);
      setDues(duesResult.data);
      setChargeFeed(chargeFeedResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !dues || !chargeFeed) {
    return <AdminAttendanceLoadingShell />;
  }

  return <ClubAdminDuesClient clubId={clubId} initialData={dues} initialChargeFeed={chargeFeed} />;
}
