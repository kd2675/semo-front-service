import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";

type ClubId = string | number;

export type DecisionRecordType = "DECISION" | "MEETING_MINUTES";
export type DecisionStatus = "DRAFT" | "CONFIRMED" | "SUPERSEDED" | "ARCHIVED";
export type DecisionVisibility = "MEMBERS" | "OPERATORS";

export type DecisionParticipant = {
  clubProfileId: number;
  displayName: string;
  participantRole: "DECIDER" | "PARTICIPANT" | string;
};

export type DecisionResourceLink = {
  relationType: "RELATED" | "FOLLOW_UP" | string;
  resourceType: string;
  resourceId: number;
  title: string;
  targetPath: string;
};

export type DecisionRecord = {
  decisionRecordId: number;
  clubOperatingTermId: number | null;
  operatingTermName: string | null;
  recordType: DecisionRecordType | string;
  statusCode: DecisionStatus | string;
  visibilityScope: DecisionVisibility | string;
  title: string;
  decisionContent: string;
  backgroundContext: string | null;
  rationale: string | null;
  meetingAt: string | null;
  effectiveDate: string | null;
  reviewDate: string | null;
  supersedesDecisionRecordId: number | null;
  supersedesDecisionTitle: string | null;
  createdByClubProfileId: number;
  createdByDisplayName: string;
  confirmedByClubProfileId: number | null;
  confirmedByDisplayName: string | null;
  confirmedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  participants: DecisionParticipant[];
  resourceLinks: DecisionResourceLink[];
};

export type DecisionMemberOption = {
  clubProfileId: number;
  displayName: string;
  avatarFileName: string | null;
};

export type DecisionResourceOption = {
  resourceType: string;
  resourceId: number;
  title: string;
  statusLabel: string;
  targetPath: string;
};

export type DecisionTermOption = {
  clubOperatingTermId: number;
  termName: string;
  statusCode: string;
  startDate: string;
  endDate: string;
};

export type ClubDecisionLog = {
  clubId: number;
  clubName: string;
  records: DecisionRecord[];
};

export type ClubDecisionAdminCenter = {
  clubId: number;
  clubName: string;
  fullAdmin: boolean;
  canManage: boolean;
  draftCount: number;
  confirmedCount: number;
  reviewDueCount: number;
  records: DecisionRecord[];
  memberOptions: DecisionMemberOption[];
  resourceOptions: DecisionResourceOption[];
  termOptions: DecisionTermOption[];
};

export type DecisionResourceReferenceRequest = {
  resourceType: string;
  resourceId: number;
};

export type UpsertDecisionRecordRequest = {
  recordType: DecisionRecordType;
  visibilityScope: DecisionVisibility;
  title: string;
  decisionContent: string;
  backgroundContext?: string | null;
  rationale?: string | null;
  meetingAt?: string | null;
  effectiveDate?: string | null;
  reviewDate?: string | null;
  clubOperatingTermId?: number | null;
  supersedesDecisionRecordId?: number | null;
  deciderClubProfileIds: number[];
  participantClubProfileIds: number[];
  relatedResources: DecisionResourceReferenceRequest[];
  followUpTodoItemIds: number[];
};

const memberBasePath = (clubId: ClubId) => `/api/semo/v1/clubs/${clubId}/more/decisions`;
const adminBasePath = (clubId: ClubId) => `/api/semo/v1/clubs/${clubId}/admin/more/decisions`;

export function getClubDecisionLog(clubId: ClubId) {
  return getJson<ClubDecisionLog>(memberBasePath(clubId));
}

export function getClubDecisionAdminCenter(clubId: ClubId) {
  return getJson<ClubDecisionAdminCenter>(adminBasePath(clubId));
}

export function createDecisionRecord(clubId: ClubId, request: UpsertDecisionRecordRequest) {
  return postJson<DecisionRecord>(`${adminBasePath(clubId)}/records`, request);
}

export function updateDecisionRecord(
  clubId: ClubId,
  decisionRecordId: number,
  request: UpsertDecisionRecordRequest,
) {
  return putJson<DecisionRecord>(`${adminBasePath(clubId)}/records/${decisionRecordId}`, request);
}

export function confirmDecisionRecord(clubId: ClubId, decisionRecordId: number) {
  return putJson<DecisionRecord>(`${adminBasePath(clubId)}/records/${decisionRecordId}/confirm`, undefined);
}

export function archiveDecisionRecord(clubId: ClubId, decisionRecordId: number) {
  return putJson<DecisionRecord>(`${adminBasePath(clubId)}/records/${decisionRecordId}/archive`, undefined);
}

export function deleteDecisionDraft(clubId: ClubId, decisionRecordId: number) {
  return deleteJson<boolean>(`${adminBasePath(clubId)}/records/${decisionRecordId}`);
}
