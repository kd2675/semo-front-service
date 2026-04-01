"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminDues,
  getMyClub,
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

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, duesResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminDues(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }
      if (!duesResult.ok || !duesResult.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      setClub(clubResult.data);
      setDues(duesResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !dues) {
    return <AdminAttendanceLoadingShell />;
  }

  return <ClubAdminDuesClient clubId={clubId} initialData={dues} />;
}
