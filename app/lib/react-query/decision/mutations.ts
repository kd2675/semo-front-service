import { mutationOptions } from "@tanstack/react-query";

import {
  archiveDecisionRecord,
  confirmDecisionRecord,
  createDecisionRecord,
  deleteDecisionDraft,
  updateDecisionRecord,
} from "@/app/lib/semo/decision";

export const createDecisionRecordMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (request: Parameters<typeof createDecisionRecord>[1]) => createDecisionRecord(clubId, request),
});

export const updateDecisionRecordMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: ({ decisionRecordId, request }: {
    decisionRecordId: number;
    request: Parameters<typeof updateDecisionRecord>[2];
  }) => updateDecisionRecord(clubId, decisionRecordId, request),
});

export const confirmDecisionRecordMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (decisionRecordId: number) => confirmDecisionRecord(clubId, decisionRecordId),
});

export const archiveDecisionRecordMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (decisionRecordId: number) => archiveDecisionRecord(clubId, decisionRecordId),
});

export const deleteDecisionDraftMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (decisionRecordId: number) => deleteDecisionDraft(clubId, decisionRecordId),
});
