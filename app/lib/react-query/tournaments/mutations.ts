import { mutationOptions } from "@tanstack/react-query";
import {
  applyClubTournament,
  cancelClubTournament,
  cancelClubTournamentApplication,
  createClubTournamentScheduleSlot,
  createClubTournament,
  deleteClubTournamentScheduleSlot,
  deleteClubTournament,
  reviewClubTournament,
  reviewClubTournamentApplication,
  updateClubTournamentApplicationOperations,
  updateClubTournamentScheduleSlot,
  updateClubTournament,
} from "@/app/lib/clubs";
import type {
  ReviewTournamentApplicationRequest,
  SubmitTournamentApplicationRequest,
} from "@/app/lib/clubs";

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
    mutationFn: (request: SubmitTournamentApplicationRequest = {}) =>
      applyClubTournament(clubId, tournamentRecordId, request),
  });
}

export function updateTournamentApplicationOperationsMutationOptions(
  clubId: string,
  tournamentRecordId: string,
) {
  return mutationOptions({
    mutationFn: ({ tournamentApplicationId, request }: {
      tournamentApplicationId: number;
      request: Parameters<typeof updateClubTournamentApplicationOperations>[3];
    }) => updateClubTournamentApplicationOperations(
      clubId,
      tournamentRecordId,
      tournamentApplicationId,
      request,
    ),
  });
}

export function saveTournamentScheduleSlotMutationOptions(
  clubId: string,
  tournamentRecordId: string,
) {
  return mutationOptions({
    mutationFn: ({ scheduleSlotId, request }: {
      scheduleSlotId?: number | null;
      request: Parameters<typeof createClubTournamentScheduleSlot>[2];
    }) => scheduleSlotId == null
      ? createClubTournamentScheduleSlot(clubId, tournamentRecordId, request)
      : updateClubTournamentScheduleSlot(clubId, tournamentRecordId, scheduleSlotId, request),
  });
}

export function deleteTournamentScheduleSlotMutationOptions(
  clubId: string,
  tournamentRecordId: string,
) {
  return mutationOptions({
    mutationFn: (scheduleSlotId: number) =>
      deleteClubTournamentScheduleSlot(clubId, tournamentRecordId, scheduleSlotId),
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
