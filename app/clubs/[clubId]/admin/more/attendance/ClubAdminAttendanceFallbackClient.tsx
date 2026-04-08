"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminAttendanceQueryOptions } from "@/app/lib/react-query/attendance/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { ClubAdminAttendanceClient } from "./ClubAdminAttendanceClient";
import { AdminAttendanceLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminAttendanceFallbackClientProps = {
  clubId: string;
};

export function ClubAdminAttendanceFallbackClient({
  clubId,
}: ClubAdminAttendanceFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, attendanceQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminAttendanceQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const attendance = attendanceQuery.data ?? null;

  useEffect(() => {
    if (!clubQuery.isPending && (clubQuery.isError || !club || !club.admin)) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [club, clubId, clubQuery.isError, clubQuery.isPending, router]);

  useEffect(() => {
    if (!attendanceQuery.isPending && attendanceQuery.isError) {
        router.replace(`/clubs/${clubId}/admin`);
    }
  }, [attendanceQuery.isError, attendanceQuery.isPending, clubId, router]);

  if (!club || !attendance) {
    return <AdminAttendanceLoadingShell />;
  }

  return <ClubAdminAttendanceClient initialData={attendance} />;
}
