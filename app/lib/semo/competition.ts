import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";

type ClubId = string | number;

export type TournamentApplicationSummary = {
  tournamentApplicationId: number;
  clubProfileId: number;
  applicantDisplayName: string;
  applicantAvatarImageUrl: string | null;
  applicantAvatarThumbnailUrl: string | null;
  applicationStatus: "APPLIED" | "WAITLISTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  applicationNote: string | null;
  teamName: string | null;
  waitlistPosition: number | null;
  financePaymentId: number | null;
  feePaymentStatusCode: "PENDING" | "PAID" | "WAIVED" | null;
  feePaymentStatusLabel: string | null;
  checkedInAtLabel: string | null;
  placement: number | null;
  resultNote: string | null;
  rosterMembers: TournamentRosterMember[];
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
  teamName: string | null;
  financePaymentId: number | null;
  feePaymentStatusCode: "PENDING" | "PAID" | "WAIVED" | null;
  feePaymentStatusLabel: string | null;
  checkedInAtLabel: string | null;
  placement: number | null;
  resultNote: string | null;
  rosterMembers: TournamentRosterMember[];
};

export type TournamentRosterMember = {
  clubProfileId: number;
  displayName: string;
  avatarImageUrl: string | null;
  avatarThumbnailUrl: string | null;
  rosterRoleCode: "CAPTAIN" | "MEMBER" | string;
};

export type TournamentRosterOption = {
  clubProfileId: number;
  displayName: string;
  avatarImageUrl: string | null;
  avatarThumbnailUrl: string | null;
};

export type TournamentScheduleSlot = {
  tournamentScheduleSlotId: number;
  title: string;
  courtLabel: string | null;
  startAt: string;
  startAtLabel: string;
  endAt: string;
  endAtLabel: string;
  note: string | null;
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
  canReview: boolean;
  canDelete: boolean;
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
  viewerClubProfileId: number;
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
  myApplicationStatus: "APPLIED" | "WAITLISTED" | "APPROVED" | "REJECTED" | "CANCELLED" | null;
  participating: boolean;
  canReviewTournament: boolean;
  canEdit: boolean;
  canCancelTournament: boolean;
  canDelete: boolean;
  canManageApplications: boolean;
  applications: TournamentApplicationSummary[];
  participants: TournamentParticipantSummary[];
  scheduleSlots: TournamentScheduleSlot[];
  availableRosterMembers: TournamentRosterOption[];
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
  teamName?: string | null;
  rosterClubProfileIds?: number[];
};

export type UpsertTournamentScheduleSlotRequest = {
  title: string;
  courtLabel?: string | null;
  startAt: string;
  endAt: string;
  note?: string | null;
};

export type UpdateTournamentApplicationOperationsRequest = {
  checkedIn?: boolean | null;
  placement?: number | null;
  resultNote?: string | null;
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
  canReview: boolean;
  canDelete: boolean;
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

export function getClubTournamentHome(clubId: ClubId) {
  return getJson<ClubTournamentHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/tournaments`);
}

export function getClubAdminTournamentHome(clubId: ClubId) {
  return getJson<ClubAdminTournamentHomeResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/tournaments`);
}

export function getClubTournamentDetail(clubId: ClubId, tournamentRecordId: string | number) {
  return getJson<TournamentDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}`);
}

export function createClubTournament(clubId: ClubId, request: UpsertTournamentRequest) {
  return postJson<TournamentUpsertResponse>(`/api/semo/v1/clubs/${clubId}/more/tournaments`, request);
}

export function updateClubTournament(clubId: ClubId, tournamentRecordId: string | number, request: UpsertTournamentRequest) {
  return putJson<TournamentUpsertResponse>(`/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}`, request);
}

export function cancelClubTournament(
  clubId: ClubId,
  tournamentRecordId: string | number,
  request: CancelTournamentRequest,
) {
  return putJson<TournamentDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/cancel`, request);
}

export function applyClubTournament(
  clubId: ClubId,
  tournamentRecordId: string | number,
  request: SubmitTournamentApplicationRequest,
) {
  return postJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/applications`,
    request,
  );
}

export function cancelClubTournamentApplication(clubId: ClubId, tournamentRecordId: string | number) {
  return deleteJson<TournamentDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/applications/me`);
}

export function reviewClubTournamentApplication(
  clubId: ClubId,
  tournamentRecordId: string | number,
  tournamentApplicationId: string | number,
  request: ReviewTournamentApplicationRequest,
) {
  return putJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/applications/${tournamentApplicationId}/review`,
    request,
  );
}

export function updateClubTournamentApplicationOperations(
  clubId: ClubId,
  tournamentRecordId: string | number,
  tournamentApplicationId: string | number,
  request: UpdateTournamentApplicationOperationsRequest,
) {
  return putJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/applications/${tournamentApplicationId}/operations`,
    request,
  );
}

export function createClubTournamentScheduleSlot(
  clubId: ClubId,
  tournamentRecordId: string | number,
  request: UpsertTournamentScheduleSlotRequest,
) {
  return postJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/schedule-slots`,
    request,
  );
}

export function updateClubTournamentScheduleSlot(
  clubId: ClubId,
  tournamentRecordId: string | number,
  scheduleSlotId: string | number,
  request: UpsertTournamentScheduleSlotRequest,
) {
  return putJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/schedule-slots/${scheduleSlotId}`,
    request,
  );
}

export function deleteClubTournamentScheduleSlot(
  clubId: ClubId,
  tournamentRecordId: string | number,
  scheduleSlotId: string | number,
) {
  return deleteJson<TournamentDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/tournaments/${tournamentRecordId}/schedule-slots/${scheduleSlotId}`,
  );
}

export function reviewClubTournament(clubId: ClubId, tournamentRecordId: string | number, request: ReviewTournamentRecordRequest) {
  return putJson<TournamentDetailResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/tournaments/${tournamentRecordId}/review`, request);
}

export function deleteClubTournament(clubId: ClubId, tournamentRecordId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/admin/more/tournaments/${tournamentRecordId}`);
}

export function getClubBracketHome(clubId: ClubId) {
  return getJson<ClubBracketHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/brackets`);
}

export function getClubAdminBracketHome(clubId: ClubId) {
  return getJson<ClubAdminBracketHomeResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/brackets`);
}

export function getClubBracketDetail(clubId: ClubId, bracketRecordId: string | number) {
  return getJson<BracketDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/brackets/${bracketRecordId}`);
}

export function createClubBracket(clubId: ClubId, request: UpsertBracketRequest) {
  return postJson<BracketUpsertResponse>(`/api/semo/v1/clubs/${clubId}/more/brackets`, request);
}

export function updateClubBracket(clubId: ClubId, bracketRecordId: string | number, request: UpsertBracketRequest) {
  return putJson<BracketUpsertResponse>(`/api/semo/v1/clubs/${clubId}/more/brackets/${bracketRecordId}`, request);
}

export function submitClubBracket(clubId: ClubId, bracketRecordId: string | number) {
  return putJson<BracketDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/brackets/${bracketRecordId}/submit`, undefined);
}

export function reviewClubBracket(clubId: ClubId, bracketRecordId: string | number, request: ReviewBracketRequest) {
  return putJson<BracketDetailResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/brackets/${bracketRecordId}/review`, request);
}

export function deleteClubBracket(clubId: ClubId, bracketRecordId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/admin/more/brackets/${bracketRecordId}`);
}
