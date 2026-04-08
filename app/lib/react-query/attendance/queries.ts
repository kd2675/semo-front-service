import { queryOptions } from "@tanstack/react-query";
import { getClubAdminAttendance, getClubAttendance } from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const attendanceQueryKeys = {
  attendance: (clubId: string) => ["semo", "clubs", clubId, "attendance"] as const,
  adminAttendance: (clubId: string) => ["semo", "clubs", clubId, "admin-attendance"] as const,
};

export function attendanceQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: attendanceQueryKeys.attendance(clubId),
    queryFn: async () =>
      requireApiData(await getClubAttendance(clubId), "출석 정보를 불러오지 못했습니다."),
  });
}

export function adminAttendanceQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: attendanceQueryKeys.adminAttendance(clubId),
    queryFn: async () =>
      requireApiData(await getClubAdminAttendance(clubId), "출석 정보를 불러오지 못했습니다."),
  });
}
