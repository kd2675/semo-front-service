import { mutationOptions } from "@tanstack/react-query";
import { createClubFeedback, updateClubAdminFeedback } from "@/app/lib/clubs";

export function createFeedbackMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubFeedback>[1]) =>
      createClubFeedback(clubId, request),
  });
}

export function updateFeedbackMutationOptions(clubId: string, feedbackId: number) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof updateClubAdminFeedback>[2]) =>
      updateClubAdminFeedback(clubId, feedbackId, request),
  });
}
