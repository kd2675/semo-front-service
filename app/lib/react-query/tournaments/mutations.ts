import { mutationOptions } from "@tanstack/react-query";
import {
  applyClubTournament,
  cancelClubTournament,
  cancelClubTournamentApplication,
  createClubTournament,
  deleteClubTournament,
  reviewClubTournament,
  reviewClubTournamentApplication,
  updateClubTournament,
} from "@/app/lib/clubs";
import type { ReviewTournamentApplicationRequest } from "@/app/lib/clubs";

export function saveTournamentMutationOptions(clubId: string, tournamentRecordId?: string | null) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubTournament>[1]) =>
      tournamentRecordId != null
        ? updateClubTournament(clubId, tournamentRecordId, request)
        : createClubTournament(clubId, request),
  });
}

export function applyTournamentMutationOptions(clubId: string, tournamentRecordId: string) {
  return mutationOptions({
    mutationFn: () => applyClubTournament(clubId, tournamentRecordId, {}),
  });
}

export function cancelTournamentApplicationMutationOptions(clubId: string, tournamentRecordId: string) {
  return mutationOptions({
    mutationFn: () => cancelClubTournamentApplication(clubId, tournamentRecordId),
  });
}

export function reviewTournamentApplicationMutationOptions(clubId: string, tournamentRecordId: string) {
  return mutationOptions({
    mutationFn: ({
      tournamentApplicationId,
      applicationStatus,
      reviewNote,
    }: {
      tournamentApplicationId: number;
      applicationStatus: ReviewTournamentApplicationRequest["applicationStatus"];
      reviewNote?: ReviewTournamentApplicationRequest["reviewNote"];
    }) =>
      reviewClubTournamentApplication(clubId, tournamentRecordId, tournamentApplicationId, {
        applicationStatus,
        reviewNote,
      }),
  });
}

export function reviewTournamentMutationOptions(clubId: string, tournamentRecordId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof reviewClubTournament>[2]) =>
      reviewClubTournament(clubId, tournamentRecordId, request),
  });
}

export function cancelTournamentMutationOptions(clubId: string, tournamentRecordId: string) {
  return mutationOptions({
    mutationFn: () => cancelClubTournament(clubId, tournamentRecordId, { cancelReason: "작성자가 조기 취소" }),
  });
}

export function deleteTournamentMutationOptions(clubId: string, tournamentRecordId?: string) {
  return mutationOptions({
    mutationFn: (targetTournamentRecordId?: number | string) =>
      deleteClubTournament(clubId, targetTournamentRecordId ?? (tournamentRecordId as string)),
  });
}
