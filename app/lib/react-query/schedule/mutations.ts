import { mutationOptions } from "@tanstack/react-query";
import {
  closeClubScheduleVote,
  createClubScheduleEvent,
  createClubScheduleVote,
  deleteClubScheduleEvent,
  deleteClubScheduleVote,
  submitClubScheduleVoteSelection,
  updateClubScheduleEvent,
  updateClubScheduleEventParticipation,
  updateClubScheduleVote,
} from "@/app/lib/clubs";

export function saveScheduleEventMutationOptions(clubId: string, eventId?: string | null) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubScheduleEvent>[1]) =>
      eventId != null
        ? updateClubScheduleEvent(clubId, eventId, request)
        : createClubScheduleEvent(clubId, request),
  });
}

export function deleteScheduleEventMutationOptions(clubId: string, eventId?: string | null) {
  return mutationOptions({
    mutationFn: (targetEventId?: number | string) =>
      deleteClubScheduleEvent(clubId, targetEventId ?? (eventId as string)),
  });
}

export function updateScheduleParticipationMutationOptions(clubId: string, eventId: string) {
  return mutationOptions({
    mutationFn: (
      participationStatus: Parameters<typeof updateClubScheduleEventParticipation>[2]["participationStatus"],
    ) =>
      updateClubScheduleEventParticipation(clubId, eventId, { participationStatus }),
  });
}

export function saveScheduleVoteMutationOptions(clubId: string, voteId?: string | null) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubScheduleVote>[1]) =>
      voteId != null
        ? updateClubScheduleVote(clubId, voteId, request)
        : createClubScheduleVote(clubId, request),
  });
}

export function deleteScheduleVoteMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (voteId: number) => deleteClubScheduleVote(clubId, voteId),
  });
}

export function submitScheduleVoteSelectionMutationOptions(clubId: string, voteId: string) {
  return mutationOptions({
    mutationFn: (voteOptionId: number) =>
      submitClubScheduleVoteSelection(clubId, voteId, { voteOptionId }),
  });
}

export function closeScheduleVoteMutationOptions(clubId: string, voteId: string) {
  return mutationOptions({
    mutationFn: () => closeClubScheduleVote(clubId, voteId),
  });
}
