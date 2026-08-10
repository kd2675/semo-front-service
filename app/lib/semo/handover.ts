import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";

type ClubId = string | number;

export type OperatingTermType = "YEAR" | "SEMESTER" | "SEASON" | "CUSTOM";
export type OperatingTermStatus = "PLANNED" | "ACTIVE" | "CLOSED";
export type HandoverNoteStatus = "DRAFT" | "READY" | "ACKNOWLEDGED";

export type ClubOperatingTerm = {
  clubOperatingTermId: number;
  termName: string;
  termType: OperatingTermType | string;
  startDate: string;
  endDate: string;
  statusCode: OperatingTermStatus | string;
  description: string | null;
  activatedAt: string | null;
  closedAt: string | null;
};

export type ClubExecutiveAssignment = {
  clubTermExecutiveAssignmentId: number;
  clubOperatingTermId: number;
  clubMemberId: number;
  clubProfileId: number;
  memberDisplayName: string;
  avatarFileName: string | null;
  clubPositionId: number;
  positionDisplayName: string;
  positionIconName: string | null;
  positionColorHex: string | null;
  responsibility: string | null;
  sortOrder: number;
};

export type ClubHandoverNote = {
  clubHandoverNoteId: number;
  fromTermId: number | null;
  fromTermName: string | null;
  toTermId: number | null;
  toTermName: string | null;
  clubPositionId: number | null;
  positionDisplayName: string | null;
  assignedClubProfileId: number | null;
  assignedMemberDisplayName: string | null;
  title: string;
  content: string;
  statusCode: HandoverNoteStatus | string;
  dueAt: string | null;
  createdByClubProfileId: number;
  createdByDisplayName: string;
  acknowledgedByClubProfileId: number | null;
  acknowledgedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ClubTermCarryoverItem = {
  clubTermCarryoverItemId: number;
  fromTermId: number;
  fromTermName: string | null;
  toTermId: number;
  toTermName: string | null;
  resourceType: string;
  resourceId: number;
  title: string;
  statusSnapshot: string;
  targetPath: string;
  dueAt: string | null;
  statusCode: "OPEN" | "RESOLVED" | string;
  transferredAt: string;
  resolvedAt: string | null;
};

export type HandoverQueueSummary = {
  openTodoCount: number;
  overdueTodoCount: number;
  unpaidPaymentCount: number;
  pendingFinanceRequestCount: number;
  upcomingScheduleCount: number;
  openFeedbackCount: number;
  pendingJoinRequestCount: number;
  openHandoverNoteCount: number;
  openCarryoverCount: number;
};

export type HandoverQueueItem = {
  resourceType: string;
  resourceId: number | null;
  title: string;
  statusLabel: string;
  dueAt: string | null;
  targetPath: string;
  urgent: boolean;
};

export type ClubTermMetrics = {
  todoCount: number;
  scheduleCount: number;
  tournamentCount: number;
  financeObligationCount: number;
  financeRequestCount: number;
  financeExpenseAmount: number;
  currencyCode: string;
};

export type HandoverRecentDecision = {
  decisionRecordId: number;
  recordType: string;
  title: string;
  effectiveDate: string | null;
  confirmedAt: string | null;
  targetPath: string;
};

export type HandoverMemberOption = {
  clubMemberId: number;
  clubProfileId: number;
  displayName: string;
  avatarFileName: string | null;
};

export type HandoverPositionOption = {
  clubPositionId: number;
  displayName: string;
  description: string | null;
  iconName: string | null;
  colorHex: string | null;
};

export type ClubHandoverCenter = {
  clubId: number;
  clubName: string;
  fullAdmin: boolean;
  canManage: boolean;
  viewerClubProfileId: number;
  activeTerm: ClubOperatingTerm | null;
  nextTerm: ClubOperatingTerm | null;
  selectedTerm: ClubOperatingTerm | null;
  terms: ClubOperatingTerm[];
  executiveAssignments: ClubExecutiveAssignment[];
  handoverNotes: ClubHandoverNote[];
  carryoverItems: ClubTermCarryoverItem[];
  queueSummary: HandoverQueueSummary;
  queueItems: HandoverQueueItem[];
  recentDecisions: HandoverRecentDecision[];
  activeTermMetrics: ClubTermMetrics;
  memberOptions: HandoverMemberOption[];
  positionOptions: HandoverPositionOption[];
};

export type UpsertOperatingTermRequest = {
  termName: string;
  termType: OperatingTermType;
  startDate: string;
  endDate: string;
  description?: string | null;
};

export type UpsertExecutiveAssignmentRequest = {
  clubMemberId: number;
  clubPositionId: number;
  responsibility?: string | null;
  sortOrder?: number;
};

export type UpsertHandoverNoteRequest = {
  fromTermId?: number | null;
  toTermId?: number | null;
  clubPositionId?: number | null;
  assignedClubProfileId?: number | null;
  title: string;
  content: string;
  statusCode?: "DRAFT" | "READY";
  dueAt?: string | null;
};

const basePath = (clubId: ClubId) => `/api/semo/v1/clubs/${clubId}/admin/more/handover`;

export function getClubHandoverCenter(clubId: ClubId, termId?: number | null) {
  const params = new URLSearchParams();
  if (termId != null) params.set("termId", String(termId));
  const query = params.toString();
  return getJson<ClubHandoverCenter>(`${basePath(clubId)}${query ? `?${query}` : ""}`);
}

export function createOperatingTerm(clubId: ClubId, request: UpsertOperatingTermRequest) {
  return postJson<ClubOperatingTerm>(`${basePath(clubId)}/terms`, request);
}

export function updateOperatingTerm(clubId: ClubId, termId: number, request: UpsertOperatingTermRequest) {
  return putJson<ClubOperatingTerm>(`${basePath(clubId)}/terms/${termId}`, request);
}

export function activateOperatingTerm(clubId: ClubId, termId: number) {
  return putJson<ClubOperatingTerm>(`${basePath(clubId)}/terms/${termId}/activate`, undefined);
}

export function closeOperatingTerm(clubId: ClubId, termId: number) {
  return putJson<ClubOperatingTerm>(`${basePath(clubId)}/terms/${termId}/close`, undefined);
}

export function upsertExecutiveAssignment(
  clubId: ClubId,
  termId: number,
  request: UpsertExecutiveAssignmentRequest,
) {
  return postJson<ClubExecutiveAssignment>(`${basePath(clubId)}/terms/${termId}/executives`, request);
}

export function deleteExecutiveAssignment(clubId: ClubId, assignmentId: number) {
  return deleteJson<boolean>(`${basePath(clubId)}/executives/${assignmentId}`);
}

export function createHandoverNote(clubId: ClubId, request: UpsertHandoverNoteRequest) {
  return postJson<ClubHandoverNote>(`${basePath(clubId)}/notes`, request);
}

export function updateHandoverNote(clubId: ClubId, noteId: number, request: UpsertHandoverNoteRequest) {
  return putJson<ClubHandoverNote>(`${basePath(clubId)}/notes/${noteId}`, request);
}

export function acknowledgeHandoverNote(clubId: ClubId, noteId: number) {
  return putJson<ClubHandoverNote>(`${basePath(clubId)}/notes/${noteId}/acknowledge`, undefined);
}

export function deleteHandoverNote(clubId: ClubId, noteId: number) {
  return deleteJson<boolean>(`${basePath(clubId)}/notes/${noteId}`);
}

export function updateCarryoverStatus(clubId: ClubId, carryoverItemId: number, resolved: boolean) {
  return putJson<ClubTermCarryoverItem>(
    `${basePath(clubId)}/carryovers/${carryoverItemId}/${resolved ? "resolve" : "reopen"}`,
    undefined,
  );
}
