import { queryOptions } from "@tanstack/react-query";
import {
  getClubJoinRequestInbox,
  getClubAdminJoinRequestInbox,
  getClubAdminMemberDirectorySettings,
  getClubAdminMembers,
  getClubMemberDirectory,
} from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const memberQueryKeys = {
  adminMembers: (clubId: string) => ["semo", "clubs", clubId, "admin-members"] as const,
  joinRequestInbox: (clubId: string) => ["semo", "clubs", clubId, "join-request-inbox"] as const,
  adminJoinRequestInbox: (clubId: string) =>
    ["semo", "clubs", clubId, "admin-join-request-inbox"] as const,
  memberDirectory: (clubId: string) =>
    ["semo", "clubs", clubId, "member-directory"] as const,
  adminMemberDirectorySettings: (clubId: string) =>
    ["semo", "clubs", clubId, "admin-member-directory-settings"] as const,
};

export function adminMembersQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.adminMembers(clubId),
    queryFn: async () =>
      requireApiData(await getClubAdminMembers(clubId), "멤버 정보를 불러오지 못했습니다."),
  });
}

export function joinRequestInboxQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.joinRequestInbox(clubId),
    queryFn: async () =>
      requireApiData(await getClubJoinRequestInbox(clubId), "가입 신청 정보를 불러오지 못했습니다."),
  });
}

export function adminJoinRequestInboxQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.adminJoinRequestInbox(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminJoinRequestInbox(clubId),
        "가입 신청 정보를 불러오지 못했습니다.",
      ),
  });
}

export function memberDirectoryQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.memberDirectory(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubMemberDirectory(clubId),
        "멤버 디렉터리를 불러오지 못했습니다.",
      ),
  });
}

export function adminMemberDirectorySettingsQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: memberQueryKeys.adminMemberDirectorySettings(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminMemberDirectorySettings(clubId),
        "멤버 디렉터리 설정을 불러오지 못했습니다.",
      ),
  });
}
