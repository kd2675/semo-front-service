import { getJson, postJson } from "@/app/lib/api";

type ClubId = string | number;

export type AttendanceToday = {
  attendanceDateLabel: string;
  checkedIn: boolean;
  checkedInAtLabel: string | null;
  canCheckIn: boolean;
  checkedInCount: number;
  memberCount: number;
};

export type AttendanceDailyLog = {
  attendanceDateLabel: string;
  checkedInCount: number;
  memberCount: number;
  checkedIn: boolean;
  checkedInAtLabel: string | null;
};

export type ClubAttendanceResponse = {
  clubId: number;
  clubName: string;
  featureEnabled: boolean;
  todayAttendance: AttendanceToday | null;
  recentLogs: AttendanceDailyLog[];
};

export type AdminAttendanceMember = {
  clubProfileId: number;
  displayName: string;
  roleCode: string;
  checkedIn: boolean;
  checkedInAtLabel: string | null;
};

export type ClubAdminAttendanceResponse = {
  clubId: number;
  clubName: string;
  featureEnabled: boolean;
  todayAttendance: AttendanceToday | null;
  members: AdminAttendanceMember[];
  recentLogs: AttendanceDailyLog[];
};

export function getClubAttendance(clubId: ClubId) {
  return getJson<ClubAttendanceResponse>(`/api/semo/v1/clubs/${clubId}/more/attendance`);
}

export function checkInClubAttendance(clubId: ClubId) {
  return postJson<AttendanceToday>(`/api/semo/v1/clubs/${clubId}/more/attendance/check-in`, undefined);
}

export function getClubAdminAttendance(clubId: ClubId) {
  return getJson<ClubAdminAttendanceResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/attendance`);
}
