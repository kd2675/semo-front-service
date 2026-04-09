import { mutationOptions } from "@tanstack/react-query";
import {
  reviewClubAdminJoinRequestInbox,
  updateClubAdminMemberDirectorySettings,
  updateClubAdminMemberRole,
  updateClubAdminMemberStatus,
} from "@/app/lib/clubs";

export function reviewJoinRequestMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({
      clubJoinRequestId,
      requestStatus,
    }: {
      clubJoinRequestId: number;
      requestStatus: Parameters<typeof reviewClubAdminJoinRequestInbox>[2]["requestStatus"];
    }) => reviewClubAdminJoinRequestInbox(clubId, clubJoinRequestId, { requestStatus }),
  });
}

export function updateMemberRoleMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({
      clubMemberId,
      roleCode,
    }: {
      clubMemberId: number;
      roleCode: Parameters<typeof updateClubAdminMemberRole>[2]["roleCode"];
    }) => updateClubAdminMemberRole(clubId, clubMemberId, { roleCode }),
  });
}

export function updateMemberStatusMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({
      clubMemberId,
      membershipStatus,
    }: {
      clubMemberId: number;
      membershipStatus: Parameters<typeof updateClubAdminMemberStatus>[2]["membershipStatus"];
    }) => updateClubAdminMemberStatus(clubId, clubMemberId, { membershipStatus }),
  });
}

export function updateMemberDirectorySettingsMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof updateClubAdminMemberDirectorySettings>[1]) =>
      updateClubAdminMemberDirectorySettings(clubId, request),
  });
}
