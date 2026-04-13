import { getJson, postJson, putJson } from "@/app/lib/api";

type ClubId = string | number;

export type ClubFeedbackType = "SUGGESTION" | "INCONVENIENCE" | "IMPROVEMENT_REQUEST" | string;

export type ClubFeedbackVisibilityScope = "PRIVATE" | "PUBLIC" | string;

export type ClubFeedbackStatusCode = "RECEIVED" | "IN_REVIEW" | "ANSWERED" | "CLOSED" | string;

export type ClubFeedbackSummary = {
  feedbackId: number;
  feedbackType: ClubFeedbackType;
  feedbackTypeLabel: string;
  visibilityScope: ClubFeedbackVisibilityScope;
  visibilityLabel: string;
  statusCode: ClubFeedbackStatusCode;
  statusLabel: string;
  title: string;
  contentPreview: string | null;
  anonymous: boolean;
  authorDisplayName: string;
  mine: boolean;
  answered: boolean;
  createdAt: string | null;
  createdAtLabel: string | null;
  answeredAt: string | null;
  answeredAtLabel: string | null;
};

export type ClubFeedbackHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  featureEnabled: boolean;
  totalVisibleCount: number;
  mySubmissionCount: number;
  publicVisibleCount: number;
  answeredCount: number;
  items: ClubFeedbackSummary[];
};

export type ClubAdminFeedbackResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  featureEnabled: boolean;
  totalCount: number;
  receivedCount: number;
  inReviewCount: number;
  answeredCount: number;
  closedCount: number;
  privateCount: number;
  publicCount: number;
  items: ClubFeedbackSummary[];
};

export type ClubFeedbackDetailResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  featureEnabled: boolean;
  feedbackId: number;
  feedbackType: ClubFeedbackType;
  feedbackTypeLabel: string;
  visibilityScope: ClubFeedbackVisibilityScope;
  visibilityLabel: string;
  statusCode: ClubFeedbackStatusCode;
  statusLabel: string;
  title: string;
  content: string;
  anonymous: boolean;
  authorDisplayName: string;
  mine: boolean;
  canManage: boolean;
  adminAnswer: string | null;
  answeredByDisplayName: string | null;
  createdAt: string | null;
  createdAtLabel: string | null;
  updatedAt: string | null;
  updatedAtLabel: string | null;
  answeredAt: string | null;
  answeredAtLabel: string | null;
};

export type CreateClubFeedbackRequest = {
  feedbackType: ClubFeedbackType;
  title: string;
  content: string;
  anonymous?: boolean;
};

export type UpdateClubAdminFeedbackRequest = {
  feedbackType: ClubFeedbackType;
  statusCode: ClubFeedbackStatusCode;
  visibilityScope: ClubFeedbackVisibilityScope;
  adminAnswer?: string | null;
};

export function getClubFeedbackHome(clubId: ClubId) {
  return getJson<ClubFeedbackHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/feedback`);
}

export function getClubFeedbackDetail(clubId: ClubId, feedbackId: string | number) {
  return getJson<ClubFeedbackDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/feedback/${feedbackId}`);
}

export function createClubFeedback(clubId: ClubId, request: CreateClubFeedbackRequest) {
  return postJson<ClubFeedbackDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/feedback`, request);
}

export function getClubAdminFeedback(clubId: ClubId) {
  return getJson<ClubAdminFeedbackResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/feedback`);
}

export function getClubAdminFeedbackDetail(clubId: ClubId, feedbackId: string | number) {
  return getJson<ClubFeedbackDetailResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/feedback/${feedbackId}`);
}

export function updateClubAdminFeedback(
  clubId: ClubId,
  feedbackId: string | number,
  request: UpdateClubAdminFeedbackRequest,
) {
  return putJson<ClubFeedbackDetailResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/feedback/${feedbackId}`, request);
}
