"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminAttendance,
  getMyClub,
  type ClubAdminAttendanceResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubAdminAttendanceClient } from "./ClubAdminAttendanceClient";
import { AdminAttendanceLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminAttendanceFallbackClientProps = {
  clubId: string;
};

export function ClubAdminAttendanceFallbackClient({
  clubId,
}: ClubAdminAttendanceFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [attendance, setAttendance] = useState<ClubAdminAttendanceResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, attendanceResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminAttendance(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!attendanceResult.ok || !attendanceResult.data) {
        router.replace(`/clubs/${clubId}/admin`);
        return;
      }
      setClub(clubResult.data);
      setAttendance(attendanceResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !attendance) {
    return <AdminAttendanceLoadingShell />;
  }

  return <ClubAdminAttendanceClient clubId={clubId} initialData={attendance} />;
}
