import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";

export type TournamentApplicationSummary = {
  tournamentApplicationId: number;
  clubProfileId: number;
  applicantDisplayName: string;
  applicantAvatarImageUrl: string | null;
  applicantAvatarThumbnailUrl: string | null;
  applicationStatus: "APPLIED" | "APPROVED" | "REJECTED" | "CANCELLED";
  applicationNote: string | null;
  appliedAtLabel: string;
  mine: boolean;
  canReview: boolean;
  canCancel: boolean;
};

export type TournamentParticipantSummary = {
  clubProfileId: number;
  displayName: string;
  avatarImageUrl: string | null;
  avatarThumbnailUrl: string | null;
  approvedAtLabel: string | null;
};

export type TournamentSummary = {
  tournamentRecordId: number;
  title: string;
  summaryText: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  tournamentStatus: "DRAFT" | "APPLICATION_OPEN" | "ENTRY_CONFIRMED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  authorDisplayName: string;
  authorAvatarImageUrl: string | null;
  authorAvatarThumbnailUrl: string | null;
  applicationWindowLabel: string;
  tournamentPeriodLabel: string;
  startDate: string;
  endDate: string;
  locationLabel: string | null;
  matchFormat: "SINGLE" | "DOUBLE" | "TEAM";
  teamMemberLimit: number | null;
  participantLimit: number | null;
  approvedApplicationCount: number;
  participantCount: number;
  feeRequired: boolean;
  feeAmount: number | null;
  feeCurrencyCode: string;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  pinned: boolean;
  mine: boolean;
  participating: boolean;
  canEdit: boolean;
  canCancel: boolean;
  canDelete: boolean;
};

export type ClubTournamentHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  canCreate: boolean;
  totalTournamentCount: number;
  recruitingCount: number;
  ongoingCount: number;
  participatingCount: number;
  featuredTournament: TournamentSummary | null;
  tournaments: TournamentSummary[];
  myTournaments: TournamentSummary[];
  archivedTournaments: TournamentSummary[];
};

export type ClubAdminTournamentHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  totalTournamentCount: number;
  pendingTournamentCount: number;
  approvedTournamentCount: number;
  rejectedTournamentCount: number;
  tournaments: TournamentSummary[];
};

export type TournamentDetailResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  tournamentRecordId: number;
  title: string;
  summaryText: string | null;
  detailText: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  tournamentStatus: "DRAFT" | "APPLICATION_OPEN" | "ENTRY_CONFIRMED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  authorDisplayName: string;
  authorAvatarImageUrl: string | null;
  authorAvatarThumbnailUrl: string | null;
  reviewedByDisplayName: string | null;
  reviewedAtLabel: string | null;
  rejectionReason: string | null;
  applicationStartAt: string;
  applicationEndAt: string;
  applicationWindowLabel: string;
  startDate: string;
  endDate: string;
  tournamentPeriodLabel: string;
  locationLabel: string | null;
  matchFormat: "SINGLE" | "DOUBLE" | "TEAM";
  teamMemberLimit: number | null;
  participantLimit: number | null;
  feeRequired: boolean;
  feeAmount: number | null;
  feeCurrencyCode: string;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  pinned: boolean;
  cancelledAtLabel: string | null;
  cancelReason: string | null;
  applicantCount: number;
  approvedCount: number;
  participantCount: number;
  applicationOpen: boolean;
  canApply: boolean;
  applied: boolean;
  myApplicationStatus: "APPLIED" | "APPROVED" | "REJECTED" | "CANCELLED" | null;
  participating: boolean;
  canReviewTournament: boolean;
  canEdit: boolean;
  canCancelTournament: boolean;
  canDelete: boolean;
  canManageApplications: boolean;
  applications: TournamentApplicationSummary[];
  participants: TournamentParticipantSummary[];
};

export type UpsertTournamentRequest = {
  title: string;
  summaryText?: string | null;
  detailText?: string | null;
  applicationStartAt: string;
  applicationEndAt: string;
  startDate: string;
  endDate: string;
  locationLabel?: string | null;
  matchFormat: "SINGLE" | "DOUBLE" | "TEAM";
  teamMemberLimit?: number | null;
  participantLimit?: number | null;
  feeRequired: boolean;
  feeAmount?: number | null;
  feeCurrencyCode?: string | null;
  postToBoard?: boolean;
  postToCalendar?: boolean;
  pinned?: boolean;
};

export type TournamentUpsertResponse = {
  tournamentRecordId: number;
  title: string;
  startDate: string;
  endDate: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  tournamentStatus: string;
};

export type SubmitTournamentApplicationRequest = {
  applicationNote?: string | null;
};

export type CancelTournamentRequest = {
  cancelReason?: string | null;
};

export type ReviewTournamentApplicationRequest = {
  applicationStatus: "APPROVED" | "REJECTED";
  reviewNote?: string | null;
};

export type ReviewTournamentRecordRequest = {
  approvalStatus: "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
};

export type BracketImportParticipantCandidate = {
  tournamentApplicationId: number;
  clubProfileId: number | null;
  displayName: string;
};

export type BracketImportTournament = {
  tournamentRecordId: number;
  title: string;
  summaryText: string | null;
  tournamentPeriodLabel: string | null;
  participantCount: number;
  participants: BracketImportParticipantCandidate[];
};

export type BracketParticipant = {
  bracketParticipantId: number | null;
  seedNumber: number;
  clubProfileId: number | null;
  displayName: string;
  guestEntry: boolean;
  participantRole: string;
  entrySourceType: "DIRECT" | "TOURNAMENT" | string;
  sourceTournamentApplicationId: number | null;
};

export type BracketMatch = {
  matchNumber: number;
  homeParticipantName: string | null;
  awayParticipantName: string | null;
};

export type BracketRound = {
  roundNumber: number;
  title: string;
  matches: BracketMatch[];
};

export type BracketSummary = {
  bracketRecordId: number;
  title: string;
  summaryText: string | null;
  approvalStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | string;
  bracketType: "SINGLE_ELIMINATION" | string;
  participantType: "MEMBER" | "GUEST" | "MIXED" | string;
  sourceType: "DIRECT" | "TOURNAMENT" | string;
  sourceTournamentRecordId: number | null;
  sourceTournamentTitle: string | null;
  authorDisplayName: string | null;
  authorAvatarImageUrl: string | null;
  authorAvatarThumbnailUrl: string | null;
  reviewedByDisplayName: string | null;
  reviewedAtLabel: string | null;
  rejectionReason: string | null;
  participantCount: number;
  mine: boolean;
  canEdit: boolean;
  canSubmit: boolean;
  canDelete: boolean;
};

export type ClubBracketHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  canCreate: boolean;
  approvedBracketCount: number;
  pendingBracketCount: number;
  featuredBracket: BracketSummary | null;
  publishedBrackets: BracketSummary[];
  myBrackets: BracketSummary[];
  importableTournaments: BracketImportTournament[];
};

export type ClubAdminBracketHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  totalBracketCount: number;
  draftBracketCount: number;
  pendingBracketCount: number;
  approvedBracketCount: number;
  rejectedBracketCount: number;
  brackets: BracketSummary[];
};

export type BracketDetailResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  bracketRecordId: number;
  title: string;
  summaryText: string | null;
  approvalStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | string;
  bracketType: "SINGLE_ELIMINATION" | string;
  participantType: "MEMBER" | "GUEST" | "MIXED" | string;
  sourceType: "DIRECT" | "TOURNAMENT" | string;
  sourceTournamentRecordId: number | null;
  sourceTournamentTitle: string | null;
  authorDisplayName: string | null;
  authorAvatarImageUrl: string | null;
  authorAvatarThumbnailUrl: string | null;
  reviewedByDisplayName: string | null;
  reviewedAtLabel: string | null;
  rejectionReason: string | null;
  participantCount: number;
  mine: boolean;
  canEdit: boolean;
  canSubmit: boolean;
  canDelete: boolean;
  canReview: boolean;
  participants: BracketParticipant[];
  rounds: BracketRound[];
};

export type UpsertBracketParticipantRequest = {
  clubProfileId?: number | null;
  displayName: string;
  seedNumber?: number | null;
  sourceTournamentApplicationId?: number | null;
};

export type UpsertBracketRequest = {
  title: string;
  summaryText?: string | null;
  bracketType: "SINGLE_ELIMINATION" | string;
  participantType: "MEMBER" | "GUEST" | "MIXED" | string;
  sourceType: "DIRECT" | "TOURNAMENT" | string;
  sourceTournamentRecordId?: number | null;
  participants: UpsertBracketParticipantRequest[];
};

export type BracketUpsertResponse = {
  bracketRecordId: number;
  title: string;
  approvalStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | string;
  participantCount: number;
};

export type ReviewBracketRequest = {
  approvalStatus: "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
};

export function getClubTournamentHome(clubId: string | number) {
  return getJson<ClubTournamentHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/tournaments`);
}

export function getClubAdminTournamentHome(clubId: string | number) {
  return getJson<ClubAdminTournamentHomeResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/tournaments`);
}

export function getClubTournamentDetail(clubId: string | number, tournamentRecordId: string | number) {
  return getJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}`,
  );
}

export function createClubTournament(
  clubId: string | number,
  request: UpsertTournamentRequest,
) {
  return postJson<TournamentUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments`,
    request,
  );
}

export function updateClubTournament(
  clubId: string | number,
  tournamentRecordId: string | number,
  request: UpsertTournamentRequest,
) {
  return putJson<TournamentUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}`,
    request,
  );
}

export function cancelClubTournament(
  clubId: string | number,
  tournamentRecordId: string | number,
  request: CancelTournamentRequest,
) {
  return putJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/cancel`,
    request,
  );
}

export function applyClubTournament(
  clubId: string | number,
  tournamentRecordId: string | number,
  request: SubmitTournamentApplicationRequest,
) {
  return postJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/applications`,
    request,
  );
}

export function cancelClubTournamentApplication(
  clubId: string | number,
  tournamentRecordId: string | number,
) {
  return deleteJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/applications/me`,
  );
}

export function reviewClubTournamentApplication(
  clubId: string | number,
  tournamentRecordId: string | number,
  tournamentApplicationId: string | number,
  request: ReviewTournamentApplicationRequest,
) {
  return putJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/applications/${tournamentApplicationId}/review`,
    request,
  );
}

export function reviewClubTournament(
  clubId: string | number,
  tournamentRecordId: string | number,
  request: ReviewTournamentRecordRequest,
) {
  return putJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/tournaments/${tournamentRecordId}/review`,
    request,
  );
}

export function deleteClubTournament(
  clubId: string | number,
  tournamentRecordId: string | number,
) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/admin/more/tournaments/${tournamentRecordId}`);
}

export function getClubBracketHome(clubId: string | number) {
  return getJson<ClubBracketHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/brackets`);
}

export function getClubAdminBracketHome(clubId: string | number) {
  return getJson<ClubAdminBracketHomeResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/brackets`);
}

export function getClubBracketDetail(clubId: string | number, bracketRecordId: string | number) {
  return getJson<BracketDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/brackets/${bracketRecordId}`);
}

export function createClubBracket(
  clubId: string | number,
  request: UpsertBracketRequest,
) {
  return postJson<BracketUpsertResponse>(`/api/semo/v1/clubs/${clubId}/more/brackets`, request);
}

export function updateClubBracket(
  clubId: string | number,
  bracketRecordId: string | number,
  request: UpsertBracketRequest,
) {
  return putJson<BracketUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/more/brackets/${bracketRecordId}`,
    request,
  );
}

export function submitClubBracket(
  clubId: string | number,
  bracketRecordId: string | number,
) {
  return putJson<BracketDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/brackets/${bracketRecordId}/submit`,
    undefined,
  );
}

export function reviewClubBracket(
  clubId: string | number,
  bracketRecordId: string | number,
  request: ReviewBracketRequest,
) {
  return putJson<BracketDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/brackets/${bracketRecordId}/review`,
    request,
  );
}

export function deleteClubBracket(
  clubId: string | number,
  bracketRecordId: string | number,
) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/admin/more/brackets/${bracketRecordId}`);
}
