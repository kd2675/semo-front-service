"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubAdminAttendance, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";
import { ClubAdminAttendanceClient } from "./ClubAdminAttendanceClient";
import { AdminAttendanceLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminAttendanceFallbackClientProps = {
  clubId: string;
};

export function ClubAdminAttendanceFallbackClient({
  clubId,
}: ClubAdminAttendanceFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: attendance, isError: attendanceError } = useQuery({
    queryKey: adminKeys.attendance(clubId),
    queryFn: () => unwrap(getClubAdminAttendance(clubId)),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (clubError || (club && !isAdmin)) {
      router.replace(`/clubs/${clubId}`);
    } else if (attendanceError) {
      router.replace(`/clubs/${clubId}/admin`);
    }
  }, [clubError, club, isAdmin, attendanceError, clubId, router]);

  if (!club || !attendance) {
    return <AdminAttendanceLoadingShell />;
  }

  return <ClubAdminAttendanceClient initialData={attendance} />;
}
