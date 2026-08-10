import { mutationOptions } from "@tanstack/react-query";

import {
  acknowledgeHandoverNote,
  activateOperatingTerm,
  closeOperatingTerm,
  createHandoverNote,
  createOperatingTerm,
  deleteExecutiveAssignment,
  deleteHandoverNote,
  updateCarryoverStatus,
  updateHandoverNote,
  updateOperatingTerm,
  upsertExecutiveAssignment,
} from "@/app/lib/semo/handover";

export const createOperatingTermMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (request: Parameters<typeof createOperatingTerm>[1]) => createOperatingTerm(clubId, request),
});

export const updateOperatingTermMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: ({ termId, request }: { termId: number; request: Parameters<typeof updateOperatingTerm>[2] }) =>
    updateOperatingTerm(clubId, termId, request),
});

export const activateOperatingTermMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (termId: number) => activateOperatingTerm(clubId, termId),
});

export const closeOperatingTermMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (termId: number) => closeOperatingTerm(clubId, termId),
});

export const upsertExecutiveAssignmentMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: ({ termId, request }: { termId: number; request: Parameters<typeof upsertExecutiveAssignment>[2] }) =>
    upsertExecutiveAssignment(clubId, termId, request),
});

export const deleteExecutiveAssignmentMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (assignmentId: number) => deleteExecutiveAssignment(clubId, assignmentId),
});

export const createHandoverNoteMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (request: Parameters<typeof createHandoverNote>[1]) => createHandoverNote(clubId, request),
});

export const updateHandoverNoteMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: ({ noteId, request }: { noteId: number; request: Parameters<typeof updateHandoverNote>[2] }) =>
    updateHandoverNote(clubId, noteId, request),
});

export const acknowledgeHandoverNoteMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (noteId: number) => acknowledgeHandoverNote(clubId, noteId),
});

export const deleteHandoverNoteMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: (noteId: number) => deleteHandoverNote(clubId, noteId),
});

export const updateCarryoverStatusMutationOptions = (clubId: string) => mutationOptions({
  mutationFn: ({ carryoverItemId, resolved }: { carryoverItemId: number; resolved: boolean }) =>
    updateCarryoverStatus(clubId, carryoverItemId, resolved),
});
