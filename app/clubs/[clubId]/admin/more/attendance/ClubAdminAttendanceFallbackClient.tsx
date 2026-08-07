"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
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
  const [clubQuery, attendanceQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminAttendanceQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const attendance = attendanceQuery.data ?? null;

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="출석 관리"
        heading="관리자 권한이 필요합니다"
        message="출석 관리는 클럽 관리자만 사용할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if ((clubQuery.isError || attendanceQuery.isError) && (!club || !attendance)) {
    return (
      <ClubRouteErrorState
        title="출석 관리"
        message={getQueryErrorMessage(clubQuery.error ?? attendanceQuery.error, "출석 현황을 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void Promise.all([clubQuery.refetch(), attendanceQuery.refetch()])}
      />
    );
  }

  if (!club || !attendance) {
    return <AdminAttendanceLoadingShell />;
  }

  return <ClubAdminAttendanceClient initialData={attendance} />;
}
