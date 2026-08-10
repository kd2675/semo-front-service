import { mutationOptions } from "@tanstack/react-query";
import {
  createClubAdminRole,
  deleteClubAdminRole,
  updateClubAdminMemberPositions,
  updateClubAdminRole,
} from "@/app/lib/clubs";

export function createRoleMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubAdminRole>[1]) =>
      createClubAdminRole(clubId, request),
  });
}

export function updateRoleMutationOptions(clubId: string, positionId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof updateClubAdminRole>[2]) =>
      updateClubAdminRole(clubId, positionId, request),
  });
}

export function deleteRoleMutationOptions(clubId: string, positionId: string) {
  return mutationOptions({
    mutationFn: () => deleteClubAdminRole(clubId, positionId),
  });
}

export function updateMemberPositionsMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({
      clubMemberId,
      clubPositionIds,
    }: {
      clubMemberId: number;
      clubPositionIds: number[];
    }) => updateClubAdminMemberPositions(clubId, clubMemberId, { clubPositionIds }),
  });
}
