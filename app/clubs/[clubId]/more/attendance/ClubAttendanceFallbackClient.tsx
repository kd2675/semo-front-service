"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAttendance,
  getMyClub,
  type ClubAttendanceResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubAttendanceClient } from "./ClubAttendanceClient";

type ClubAttendanceFallbackClientProps = {
  clubId: string;
};

export function ClubAttendanceFallbackClient({
  clubId,
}: ClubAttendanceFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [attendance, setAttendance] = useState<ClubAttendanceResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, attendanceResult] = await Promise.all([
        getMyClub(clubId),
        getClubAttendance(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !attendanceResult.ok || !attendanceResult.data) {
        router.replace(`/clubs/${clubId}`);
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
    return null;
  }

  return (
    <ClubAttendanceClient
      clubId={clubId}
      initialData={attendance}
      isAdmin={club.admin}
    />
  );
}
