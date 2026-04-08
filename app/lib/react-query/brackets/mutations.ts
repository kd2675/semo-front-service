import { mutationOptions } from "@tanstack/react-query";
import {
  createClubBracket,
  deleteClubBracket,
  reviewClubBracket,
  submitClubBracket,
  updateClubBracket,
} from "@/app/lib/clubs";

export function saveBracketMutationOptions(clubId: string, editingBracketId?: number | null) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubBracket>[1]) =>
      editingBracketId == null
        ? createClubBracket(clubId, request)
        : updateClubBracket(clubId, editingBracketId, request),
  });
}

export function saveBracketDraftMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({
      editingBracketId,
      request,
    }: {
      editingBracketId?: number | null;
      request: Parameters<typeof createClubBracket>[1];
    }) =>
      editingBracketId == null
        ? createClubBracket(clubId, request)
        : updateClubBracket(clubId, editingBracketId, request),
  });
}

export function submitBracketMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (bracketRecordId: number) => submitClubBracket(clubId, bracketRecordId),
  });
}

export function reviewBracketMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({
      bracketRecordId,
      approvalStatus,
      rejectionReason,
    }: {
      bracketRecordId: number;
      approvalStatus: Parameters<typeof reviewClubBracket>[2]["approvalStatus"];
      rejectionReason?: string | null;
    }) => reviewClubBracket(clubId, bracketRecordId, { approvalStatus, rejectionReason }),
  });
}

export function deleteBracketMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (bracketRecordId: number) => deleteClubBracket(clubId, bracketRecordId),
  });
}
