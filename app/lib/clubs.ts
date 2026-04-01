import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";

export type CreateClubRequest = {
  name: string;
  description?: string | null;
  categoryKey?: string | null;
  visibilityStatus?: "PUBLIC" | "PRIVATE";
  membershipPolicy?: "APPROVAL" | "OPEN";
  fileName?: string | null;
};

export type ClubCreateResponse = {
  clubId: number;
  name: string;
  summary: string | null;
  description: string | null;
  categoryKey: string | null;
  visibilityStatus: string;
  membershipPolicy: string;
  roleCode: string;
  fileName: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
};

export type MyClubSummary = {
  clubId: number;
  name: string;
  summary: string | null;
  description: string | null;
  categoryKey: string | null;
  roleCode: string;
  admin: boolean;
  fileName: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
};

export type ClubBoardResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  notices: Array<{
    id: string;
    icon: string;
    title: string;
    summary: string;
    imageUrl: string | null;
    thumbnailUrl: string | null;
    author: string;
    timeAgo: string;
    category: "tournaments" | "matches" | "social";
  }>;
};

export type ClubNoticeListItem = {
  noticeId: number;
  title: string;
  summary: string;
  fileName: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  authorDisplayName: string;
  authorRoleCode: string | null;
  authorAvatarImageUrl: string | null;
  authorAvatarThumbnailUrl: string | null;
  publishedAtLabel: string;
  timeAgo: string;
  pinned: boolean;
  scheduleAt: string | null;
  scheduleEndAt: string | null;
  scheduleAtLabel: string | null;
  scheduleTimeEnabled: boolean;
  locationLabel: string | null;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  canManage: boolean;
  canEdit: boolean;
  canDelete: boolean;
  linkedTargetType: "SCHEDULE_EVENT" | "POLL" | null;
  linkedTargetId: number | null;
};

export type ClubNoticeFeedResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  items: ClubBoardFeedItem[];
  nextCursorBoardItemId: number | null;
  hasNext: boolean;
};

export type ClubBoardFeedItem = {
  boardItemId: number;
  readCount: number;
  contentType: "NOTICE" | "SCHEDULE_EVENT" | "SCHEDULE_VOTE" | "TOURNAMENT";
  notice: ClubNoticeListItem | null;
  event: ClubScheduleEventSummary | null;
  vote: ClubScheduleVoteSummary | null;
  tournament: TournamentSummary | null;
};

export type ClubNoticeDetailResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  noticeId: number;
  title: string;
  content: string;
  fileName: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  authorDisplayName: string;
  authorRoleCode: string | null;
  publishedAtLabel: string;
  updatedAtLabel: string;
  pinned: boolean;
  locationLabel: string | null;
  scheduleAt: string | null;
  scheduleAtLabel: string | null;
  scheduleEndAt: string | null;
  scheduleEndAtLabel: string | null;
  scheduleTimeEnabled: boolean;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  canManage: boolean;
  canEdit: boolean;
  canDelete: boolean;
  linkedTargetType: "SCHEDULE_EVENT" | "POLL" | null;
  linkedTargetId: number | null;
};

export type UpsertClubNoticeRequest = {
  title: string;
  content: string;
  fileName?: string | null;
  locationLabel?: string | null;
  scheduleAt?: string | null;
  scheduleEndAt?: string | null;
  scheduleTimeEnabled?: boolean;
  postToBoard?: boolean;
  postToCalendar?: boolean;
  postToSchedule?: boolean;
  pinned?: boolean;
};

export type ClubNoticeUpsertResponse = {
  noticeId: number;
  title: string;
  fileName: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  scheduleAt: string | null;
  scheduleAtLabel: string | null;
  scheduleTimeEnabled: boolean;
  locationLabel: string | null;
};

export type ClubNoticeHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  canCreate: boolean;
  totalNoticeCount: number;
  pinnedNoticeCount: number;
  scheduledNoticeCount: number;
  publishedTodayCount: number;
  manageableNoticeCount: number;
  notices: ClubNoticeListItem[];
  sharedEvents: ClubScheduleEventSummary[];
  sharedVotes: ClubScheduleVoteSummary[];
};

export type ClubScheduleResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  calendarYear: number;
  calendarMonth: number;
  overview: {
    upcomingEventCount: number;
    recentEventCount: number;
    voteCount: number;
    boardPostedEventCount: number;
    boardPostedVoteCount: number;
    pendingAttendanceCount: number;
    pendingVoteCount: number;
  };
  items: ClubCalendarFeedItem[];
};

export type ClubCalendarFeedItem = {
  calendarItemId: number;
  contentType: "NOTICE" | "SCHEDULE_EVENT" | "SCHEDULE_VOTE" | "TOURNAMENT";
  notice: ClubNoticeListItem | null;
  event: ClubScheduleEventSummary | null;
  vote: ClubScheduleVoteSummary | null;
  tournament: TournamentSummary | null;
};

export type ItemReadMember = {
  clubProfileId: number;
  displayName: string;
  avatarImageUrl: string | null;
  avatarThumbnailUrl: string | null;
  roleCode: string | null;
  lastReadAtLabel: string;
};

export type BoardItemReadResponse = {
  boardItemId: number;
  readCount: number;
};

export type BoardItemReadStatusResponse = {
  boardItemId: number;
  readCount: number;
  activeMemberCount: number;
  unreadCount: number;
  readers: ItemReadMember[];
};

export type ClubScheduleHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  canCreate: boolean;
  totalEventCount: number;
  upcomingEventCount: number;
  manageableItemCount: number;
  events: ClubScheduleEventSummary[];
  sharedNotices: ClubNoticeListItem[];
  sharedVotes: ClubScheduleVoteSummary[];
};

export type ClubScheduleEventSummary = {
  eventId: number;
  title: string;
  authorDisplayName: string;
  authorAvatarImageUrl: string | null;
  authorAvatarThumbnailUrl: string | null;
  startDate: string;
  endDate: string | null;
  dateLabel: string;
  timeLabel: string | null;
  attendeeLimit: number | null;
  locationLabel: string | null;
  participationConditionText: string | null;
  participationEnabled: boolean;
  feeRequired: boolean;
  feeAmount: number | null;
  feeAmountUndecided: boolean;
  feeNWaySplit: boolean;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  pinned: boolean;
  linkedNoticeId: number | null;
  myParticipationStatus: "GOING" | "NOT_GOING" | null;
  goingCount: number;
  notGoingCount: number;
  canEdit: boolean;
  canDelete: boolean;
};

export type ClubScheduleVoteOptionSummary = {
  voteOptionId: number;
  label: string;
  sortOrder: number;
  voteCount: number;
};

export type ClubScheduleVoteSummary = {
  voteId: number;
  title: string;
  authorDisplayName: string;
  authorAvatarImageUrl: string | null;
  authorAvatarThumbnailUrl: string | null;
  voteStatus: "WAITING" | "ONGOING" | "CLOSED";
  voteStartDate: string;
  voteEndDate: string;
  votePeriodLabel: string;
  voteTimeLabel: string | null;
  optionCount: number;
  totalResponses: number;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  sharedToSchedule: boolean;
  pinned: boolean;
  linkedNoticeId: number | null;
  mySelectedOptionId: number | null;
  options: ClubScheduleVoteOptionSummary[];
  votingOpen: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

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

export type ClubScheduleEventDetailResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  eventId: number;
  title: string;
  startDate: string;
  endDate: string | null;
  dateLabel: string;
  startTime: string | null;
  endTime: string | null;
  timeLabel: string | null;
  attendeeLimit: number | null;
  locationLabel: string | null;
  participationConditionText: string | null;
  participationEnabled: boolean;
  feeRequired: boolean;
  feeAmount: number | null;
  feeAmountUndecided: boolean;
  feeNWaySplit: boolean;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  pinned: boolean;
  linkedNoticeId: number | null;
  myParticipationStatus: "GOING" | "NOT_GOING" | null;
  goingCount: number;
  notGoingCount: number;
  goingParticipants: {
    clubProfileId: number;
    displayName: string;
    avatarImageUrl: string | null;
    avatarThumbnailUrl: string | null;
  }[];
  canEdit: boolean;
  canDelete: boolean;
};

export type UpsertScheduleEventRequest = {
  title: string;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  attendeeLimit?: number | null;
  locationLabel?: string | null;
  participationConditionText?: string | null;
  participationEnabled?: boolean;
  feeRequired?: boolean;
  feeAmount?: number | null;
  feeAmountUndecided?: boolean;
  feeNWaySplit?: boolean;
  postToBoard?: boolean;
  postToCalendar?: boolean;
  pinned?: boolean;
};

export type ScheduleEventUpsertResponse = {
  eventId: number;
  linkedNoticeId: number | null;
  title: string;
  startDate: string;
  endDate: string | null;
  dateLabel: string;
  timeLabel: string | null;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  pinned: boolean;
};

export type ClubScheduleVoteDetailResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  voteId: number;
  title: string;
  voteStatus: "WAITING" | "ONGOING" | "CLOSED";
  voteStartDate: string;
  voteEndDate: string;
  votePeriodLabel: string;
  voteStartTime: string | null;
  voteEndTime: string | null;
  voteTimeLabel: string | null;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  sharedToSchedule: boolean;
  pinned: boolean;
  linkedNoticeId: number | null;
  mySelectedOptionId: number | null;
  totalResponses: number;
  options: ClubScheduleVoteOptionSummary[];
  canEdit: boolean;
  canDelete: boolean;
  votingOpen: boolean;
};

export type UpdateScheduleEventParticipationRequest = {
  participationStatus: "GOING" | "NOT_GOING" | "CANCEL";
};

export type UpsertScheduleVoteRequest = {
  title: string;
  voteStartDate: string;
  voteEndDate: string;
  voteStartTime?: string | null;
  voteEndTime?: string | null;
  optionLabels: string[];
  postToBoard?: boolean;
  postToCalendar?: boolean;
  postToSchedule?: boolean;
  pinned?: boolean;
};

export type SubmitScheduleVoteSelectionRequest = {
  voteOptionId: number;
};

export type ScheduleVoteUpsertResponse = {
  voteId: number;
  linkedNoticeId: number | null;
  title: string;
  voteStartDate: string;
  voteEndDate: string;
  votePeriodLabel: string;
  voteStartTime: string | null;
  voteEndTime: string | null;
  voteTimeLabel: string | null;
  optionCount: number;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  sharedToSchedule: boolean;
  pinned: boolean;
};

export type ClubProfileResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  appProfile: {
    profileId: number;
    userKey: string;
    displayName: string;
    tagline: string | null;
    profileColor: string | null;
  };
  clubProfile: {
    clubProfileId: number;
    displayName: string;
    tagline: string | null;
    introText: string | null;
    avatarFileName: string | null;
    avatarImageUrl: string | null;
    avatarThumbnailUrl: string | null;
    roleCode: string;
    membershipStatus: string;
    joinedLabel: string;
  };
  clubRecords: Array<{
    id: string;
    title: string;
    value: string;
    description: string;
  }>;
};

export type UpdateClubProfileRequest = {
  displayName?: string | null;
  avatarFileName?: string | null;
  removeAvatar?: boolean;
};

export type ClubFeatureSummary = {
  featureKey: string;
  displayName: string;
  description: string | null;
  iconName: string;
  navigationScope: "USER_AND_ADMIN" | "ADMIN_ONLY" | string;
  enabled: boolean;
  userPath: string;
  adminPath: string;
};

export type ClubPositionSummary = {
  clubPositionId: number;
  positionCode: string;
  displayName: string;
  description: string | null;
  iconName: string | null;
  colorHex: string | null;
  active: boolean;
  permissionCount: number;
  memberCount: number;
  permissionKeys: string[];
};

export type ClubPermissionItem = {
  permissionKey: string;
  displayName: string;
  description: string | null;
  ownershipScope: string;
};

export type ClubPermissionGroup = {
  featureKey: string;
  displayName: string;
  description: string | null;
  iconName: string;
  permissions: ClubPermissionItem[];
};

export type ClubAdminMember = {
  clubMemberId: number;
  clubProfileId: number | null;
  profileId: number;
  displayName: string;
  tagline: string | null;
  avatarImageUrl: string | null;
  joinedAtLabel: string | null;
  lastActivityAtLabel: string | null;
  roleCode: "OWNER" | "ADMIN" | "MEMBER" | string;
  membershipStatus: "ACTIVE" | "DORMANT" | "PENDING" | string;
  canManage: boolean;
  canApprove: boolean;
  self: boolean;
  positions: ClubPositionSummary[];
};

export type ClubAdminMembersResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  roleManagementEnabled: boolean;
  availablePositions: ClubPositionSummary[];
  members: ClubAdminMember[];
};

export type ClubAdminActivityItem = {
  activityId: number;
  actorDisplayName: string;
  actorAvatarLabel: string;
  subject: string;
  detail: string;
  status: "SUCCESS" | "FAIL" | string;
  errorMessage: string | null;
  createdAt: string | null;
  createdAtLabel: string | null;
};

export type ClubAdminActivityFeedResponse = {
  clubId: number;
  clubName: string;
  activities: ClubAdminActivityItem[];
  nextCursorCreatedAt: string | null;
  nextCursorActivityId: number | null;
  hasNext: boolean;
};

export type UpdateClubAdminMemberRoleRequest = {
  roleCode: "OWNER" | "ADMIN" | "MEMBER" | string;
};

export type UpdateClubAdminMemberStatusRequest = {
  membershipStatus: "ACTIVE" | "DORMANT" | string;
};

export type ClubTimelineEntry = {
  activityId: number;
  actorDisplayName: string;
  actorAvatarLabel: string;
  subject: string;
  detail: string;
  status: "SUCCESS" | "FAIL" | string;
  createdAt: string | null;
  createdAtLabel: string | null;
};

export type ClubPollSummary = {
  voteId: number;
  title: string;
  authorDisplayName: string;
  authorAvatarImageUrl: string | null;
  authorAvatarThumbnailUrl: string | null;
  voteStatus: "WAITING" | "ONGOING" | "CLOSED";
  voteStartDate: string;
  voteEndDate: string;
  votePeriodLabel: string;
  voteTimeLabel: string | null;
  voteWindowLabel: string;
  totalResponses: number;
  optionCount: number;
  postedToBoard: boolean;
  postedToCalendar: boolean;
  sharedToSchedule: boolean;
  pinned: boolean;
  canEdit: boolean;
  canDelete: boolean;
  mySelectedOptionId: number | null;
  options: ClubScheduleVoteOptionSummary[];
};

export type ClubPollHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  canCreate: boolean;
  waitingCount: number;
  ongoingCount: number;
  closedCount: number;
  polls: ClubPollSummary[];
};

export type ClubTimelineResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  entries: ClubTimelineEntry[];
  nextCursorCreatedAt: string | null;
  nextCursorActivityId: number | null;
  hasNext: boolean;
};

export type ClubAdminTimelineResponse = {
  clubId: number;
  clubName: string;
};

export type DashboardScope = "USER_HOME" | "ADMIN_HOME";

export type ClubDashboardWidgetSummary = {
  widgetKey: string;
  displayName: string;
  description: string | null;
  iconName: string;
  requiredFeatureKey: string;
  visibilityScope: DashboardScope;
  available: boolean;
  enabled: boolean;
  sortOrder: number;
  columnSpan: number;
  rowSpan: number;
  title: string;
  userPath: string;
  adminPath: string;
};

export type ClubDashboardEditorResponse = {
  scope: DashboardScope;
  widgets: ClubDashboardWidgetSummary[];
};

export type UpdateClubDashboardWidgetItemRequest = {
  widgetKey: string;
  enabled?: boolean;
  sortOrder?: number;
  columnSpan?: number;
  rowSpan?: number;
  titleOverride?: string | null;
};

export type UpdateClubDashboardLayoutRequest = {
  scope: DashboardScope;
  widgets: UpdateClubDashboardWidgetItemRequest[];
};

export type UpdateClubFeaturesRequest = {
  enabledFeatureKeys: string[];
};

export type ClubAdminRoleManagementResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  roleManagementEnabled: boolean;
  positions: ClubPositionSummary[];
  permissionGroups: ClubPermissionGroup[];
};

export type ClubPositionDetailResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  roleManagementEnabled: boolean;
  position: ClubPositionSummary;
  permissionGroups: ClubPermissionGroup[];
};

export type CreateClubPositionRequest = {
  displayName: string;
  positionCode: string;
  description?: string | null;
  iconName?: string | null;
  colorHex?: string | null;
  permissionKeys: string[];
};

export type UpdateClubPositionRequest = {
  displayName: string;
  positionCode: string;
  description?: string | null;
  iconName?: string | null;
  colorHex?: string | null;
  active?: boolean;
  permissionKeys: string[];
};

export type UpdateClubMemberPositionsRequest = {
  clubPositionIds: number[];
};

export type AttendanceToday = {
  attendanceDateLabel: string;
  checkedIn: boolean;
  checkedInAtLabel: string | null;
  canCheckIn: boolean;
  checkedInCount: number;
  memberCount: number;
};

export type AttendanceDailyLog = {
  attendanceDateLabel: string;
  checkedInCount: number;
  memberCount: number;
  checkedIn: boolean;
  checkedInAtLabel: string | null;
};

export type ClubDuesSummary = {
  invoiceId: number;
  clubProfileId: number;
  memberDisplayName: string;
  memberRoleCode: string | null;
  billingYear: number;
  billingMonth: number;
  billingMonthLabel: string;
  amount: number;
  amountLabel: string;
  currencyCode: string;
  paymentStatus: "PENDING" | "OVERDUE" | "PAID" | "WAIVED" | string;
  paymentStatusLabel: string;
  overdue: boolean;
  dueAt: string | null;
  dueAtLabel: string | null;
  paidAt: string | null;
  paidAtLabel: string | null;
  note: string | null;
};

export type ClubDuesHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  pendingInvoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;
  totalPendingAmountLabel: string;
  nextInvoice: ClubDuesSummary | null;
  myInvoices: ClubDuesSummary[];
};

export type ClubAdminDuesHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  canIssue: boolean;
  canMarkPaid: boolean;
  canMarkWaive: boolean;
  activeMemberCount: number;
  totalInvoiceCount: number;
  pendingInvoiceCount: number;
  paidInvoiceCount: number;
  waivedInvoiceCount: number;
  overdueInvoiceCount: number;
  collectionRate: number;
  invoices: ClubDuesSummary[];
};

export type IssueClubDuesInvoicesRequest = {
  billingYear: number;
  billingMonth: number;
  amount: number;
  dueAt?: string | null;
  note?: string | null;
  clubProfileIds?: number[];
};

export type IssueClubDuesInvoicesResponse = {
  billingYear: number;
  billingMonth: number;
  billingMonthLabel: string;
  createdCount: number;
  skippedCount: number;
};

export type UpdateClubDuesPaymentStatusRequest = {
  paymentStatus: "PENDING" | "PAID" | "WAIVED" | string;
  note?: string | null;
};

export type ClubAttendanceResponse = {
  clubId: number;
  clubName: string;
  featureEnabled: boolean;
  todayAttendance: AttendanceToday | null;
  recentLogs: AttendanceDailyLog[];
};

export type AdminAttendanceMember = {
  clubProfileId: number;
  displayName: string;
  roleCode: string;
  checkedIn: boolean;
  checkedInAtLabel: string | null;
};

export type ClubAdminAttendanceResponse = {
  clubId: number;
  clubName: string;
  featureEnabled: boolean;
  todayAttendance: AttendanceToday | null;
  members: AdminAttendanceMember[];
  recentLogs: AttendanceDailyLog[];
};

export function createClub(request: CreateClubRequest) {
  return postJson<ClubCreateResponse>("/api/semo/v1/clubs", request);
}

export function getMyClubs() {
  return getJson<MyClubSummary[]>("/api/semo/v1/clubs/my");
}

export function getMyClub(clubId: string | number) {
  return getJson<MyClubSummary>(`/api/semo/v1/clubs/${clubId}`);
}

export function getClubBoard(clubId: string | number) {
  return getJson<ClubBoardResponse>(`/api/semo/v1/clubs/${clubId}/board`);
}

export function getClubNoticeFeed(
  clubId: string | number,
  options: {
    query?: string;
    pinnedOnly?: boolean;
    cursorBoardItemId?: number | null;
    size?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.query?.trim()) {
    params.set("query", options.query.trim());
  }
  if (options.pinnedOnly) {
    params.set("pinnedOnly", "true");
  }
  if (options.cursorBoardItemId) {
    params.set("cursorBoardItemId", String(options.cursorBoardItemId));
  }
  if (options.size) {
    params.set("size", String(options.size));
  }
  const queryString = params.toString();
  return getJson<ClubNoticeFeedResponse>(
    `/api/semo/v1/clubs/${clubId}/board/notices${queryString ? `?${queryString}` : ""}`,
  );
}

export function getClubNoticeDetail(clubId: string | number, noticeId: string | number) {
  return getJson<ClubNoticeDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/notices/${noticeId}`,
  );
}

export function getClubNoticeHome(
  clubId: string | number,
  options: {
    pinnedOnly?: boolean;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.pinnedOnly) {
    params.set("pinnedOnly", "true");
  }
  const queryString = params.toString();
  return getJson<ClubNoticeHomeResponse>(
    `/api/semo/v1/clubs/${clubId}/more/notices${queryString ? `?${queryString}` : ""}`,
  );
}

export function createClubNotice(
  clubId: string | number,
  request: UpsertClubNoticeRequest,
) {
  return postJson<ClubNoticeUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/more/notices`,
    request,
  );
}

export function updateClubNotice(
  clubId: string | number,
  noticeId: string | number,
  request: UpsertClubNoticeRequest,
) {
  return putJson<ClubNoticeUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/more/notices/${noticeId}`,
    request,
  );
}

export function deleteClubNotice(clubId: string | number, noticeId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/more/notices/${noticeId}`);
}

export function getClubSchedule(
  clubId: string | number,
  params?: { year?: number; month?: number },
) {
  const searchParams = new URLSearchParams();
  if (params?.year != null) {
    searchParams.set("year", String(params.year));
  }
  if (params?.month != null) {
    searchParams.set("month", String(params.month));
  }
  const queryString = searchParams.toString();
  return getJson<ClubScheduleResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule${queryString ? `?${queryString}` : ""}`,
  );
}

export function recordClubBoardItemRead(clubId: string | number, boardItemId: string | number) {
  return postJson<BoardItemReadResponse>(
    `/api/semo/v1/clubs/${clubId}/board/items/${boardItemId}/read`,
    {},
  );
}

export function getClubBoardItemReadStatus(clubId: string | number, boardItemId: string | number) {
  return getJson<BoardItemReadStatusResponse>(
    `/api/semo/v1/clubs/${clubId}/board/items/${boardItemId}/read-status`,
  );
}

export function getClubScheduleHome(clubId: string | number) {
  return getJson<ClubScheduleHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/schedules`);
}

export function getClubScheduleEventDetail(clubId: string | number, eventId: string | number) {
  return getJson<ClubScheduleEventDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/events/${eventId}`,
  );
}

export function createClubScheduleEvent(
  clubId: string | number,
  request: UpsertScheduleEventRequest,
) {
  return postJson<ScheduleEventUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/events`,
    request,
  );
}

export function updateClubScheduleEvent(
  clubId: string | number,
  eventId: string | number,
  request: UpsertScheduleEventRequest,
) {
  return putJson<ScheduleEventUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/events/${eventId}`,
    request,
  );
}

export function deleteClubScheduleEvent(clubId: string | number, eventId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/schedule/events/${eventId}`);
}

export function updateClubScheduleEventParticipation(
  clubId: string | number,
  eventId: string | number,
  request: UpdateScheduleEventParticipationRequest,
) {
  return putJson<ClubScheduleEventDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/events/${eventId}/participation`,
    request,
  );
}

export function getClubScheduleVoteDetail(clubId: string | number, voteId: string | number) {
  return getJson<ClubScheduleVoteDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/polls/${voteId}`,
  );
}

export function createClubScheduleVote(
  clubId: string | number,
  request: UpsertScheduleVoteRequest,
) {
  return postJson<ScheduleVoteUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/more/polls`,
    request,
  );
}

export function updateClubScheduleVote(
  clubId: string | number,
  voteId: string | number,
  request: UpsertScheduleVoteRequest,
) {
  return putJson<ScheduleVoteUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/more/polls/${voteId}`,
    request,
  );
}

export function deleteClubScheduleVote(clubId: string | number, voteId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/more/polls/${voteId}`);
}

export function submitClubScheduleVoteSelection(
  clubId: string | number,
  voteId: string | number,
  request: SubmitScheduleVoteSelectionRequest,
) {
  return putJson<ClubScheduleVoteDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/polls/${voteId}/selection`,
    request,
  );
}

export function closeClubScheduleVote(clubId: string | number, voteId: string | number) {
  return putJson<ClubScheduleVoteDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/more/polls/${voteId}/close`,
    undefined,
  );
}

export function getClubPollHome(
  clubId: string | number,
  options: {
    query?: string;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.query?.trim()) {
    params.set("query", options.query.trim());
  }
  const queryString = params.toString();
  return getJson<ClubPollHomeResponse>(
    `/api/semo/v1/clubs/${clubId}/more/polls${queryString ? `?${queryString}` : ""}`,
  );
}

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

export function getClubProfile(clubId: string | number) {
  return getJson<ClubProfileResponse>(`/api/semo/v1/clubs/${clubId}/profile`);
}

export function updateClubProfile(
  clubId: string | number,
  request: UpdateClubProfileRequest,
) {
  return putJson<ClubProfileResponse>(`/api/semo/v1/clubs/${clubId}/profile`, request);
}

export function getClubFeatures(clubId: string | number) {
  return getJson<ClubFeatureSummary[]>(`/api/semo/v1/clubs/${clubId}/features`);
}

export function getClubDashboardWidgets(
  clubId: string | number,
  scope: DashboardScope = "USER_HOME",
) {
  const params = new URLSearchParams();
  params.set("scope", scope);
  return getJson<ClubDashboardWidgetSummary[]>(
    `/api/semo/v1/clubs/${clubId}/dashboard/widgets?${params.toString()}`,
  );
}

export function getClubDashboardWidgetEditor(
  clubId: string | number,
  scope: DashboardScope = "USER_HOME",
) {
  const params = new URLSearchParams();
  params.set("scope", scope);
  return getJson<ClubDashboardEditorResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/dashboard/widgets/editor?${params.toString()}`,
  );
}

export function updateClubDashboardWidgets(
  clubId: string | number,
  request: UpdateClubDashboardLayoutRequest,
) {
  return putJson<ClubDashboardEditorResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/dashboard/widgets/layout`,
    request,
  );
}

export function updateClubFeatures(
  clubId: string | number,
  request: UpdateClubFeaturesRequest,
) {
  return putJson<ClubFeatureSummary[]>(`/api/semo/v1/clubs/${clubId}/features`, request);
}

export function getClubDues(clubId: string | number) {
  return getJson<ClubDuesHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/dues`);
}

export function getClubAdminDues(clubId: string | number) {
  return getJson<ClubAdminDuesHomeResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/dues`);
}

export function issueClubDuesInvoices(
  clubId: string | number,
  request: IssueClubDuesInvoicesRequest,
) {
  return postJson<IssueClubDuesInvoicesResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/dues/invoices`,
    request,
  );
}

export function updateClubDuesPaymentStatus(
  clubId: string | number,
  invoiceId: string | number,
  request: UpdateClubDuesPaymentStatusRequest,
) {
  return putJson<ClubDuesSummary>(
    `/api/semo/v1/clubs/${clubId}/admin/more/dues/${invoiceId}/payment-status`,
    request,
  );
}

export function getClubAttendance(clubId: string | number) {
  return getJson<ClubAttendanceResponse>(`/api/semo/v1/clubs/${clubId}/more/attendance`);
}

export function getClubAdminMembers(clubId: string | number) {
  return getJson<ClubAdminMembersResponse>(`/api/semo/v1/clubs/${clubId}/admin/members`);
}

export function getClubAdminActivities(
  clubId: string | number,
  options: {
    size?: number;
    cursorCreatedAt?: string | null;
    cursorActivityId?: number | null;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.size != null) {
    params.set("size", String(options.size));
  }
  if (options.cursorCreatedAt) {
    params.set("cursorCreatedAt", options.cursorCreatedAt);
  }
  if (options.cursorActivityId != null) {
    params.set("cursorActivityId", String(options.cursorActivityId));
  }
  const queryString = params.toString();
  return getJson<ClubAdminActivityFeedResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/activity${queryString ? `?${queryString}` : ""}`,
  );
}

export function updateClubAdminMemberRole(
  clubId: string | number,
  clubMemberId: string | number,
  request: UpdateClubAdminMemberRoleRequest,
) {
  return putJson<ClubAdminMember>(
    `/api/semo/v1/clubs/${clubId}/admin/members/${clubMemberId}/role`,
    request,
  );
}

export function updateClubAdminMemberStatus(
  clubId: string | number,
  clubMemberId: string | number,
  request: UpdateClubAdminMemberStatusRequest,
) {
  return putJson<ClubAdminMember>(
    `/api/semo/v1/clubs/${clubId}/admin/members/${clubMemberId}/status`,
    request,
  );
}

export function updateClubAdminMemberPositions(
  clubId: string | number,
  clubMemberId: string | number,
  request: UpdateClubMemberPositionsRequest,
) {
  return putJson<ClubAdminMember>(
    `/api/semo/v1/clubs/${clubId}/admin/members/${clubMemberId}/positions`,
    request,
  );
}

export function approveClubAdminMember(clubId: string | number, clubMemberId: string | number) {
  return postJson<ClubAdminMember>(
    `/api/semo/v1/clubs/${clubId}/admin/members/${clubMemberId}/approve`,
    undefined,
  );
}

export function checkInClubAttendance(clubId: string | number) {
  return postJson<AttendanceToday>(`/api/semo/v1/clubs/${clubId}/more/attendance/check-in`, undefined);
}

export function getClubAdminAttendance(clubId: string | number) {
  return getJson<ClubAdminAttendanceResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/attendance`);
}

export function getClubTimeline(
  clubId: string | number,
  options: {
    cursorCreatedAt?: string | null;
    cursorActivityId?: number | null;
    size?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.cursorCreatedAt) {
    params.set("cursorCreatedAt", options.cursorCreatedAt);
  }
  if (options.cursorActivityId != null) {
    params.set("cursorActivityId", String(options.cursorActivityId));
  }
  if (options.size) {
    params.set("size", String(options.size));
  }
  const queryString = params.toString();
  return getJson<ClubTimelineResponse>(
    `/api/semo/v1/clubs/${clubId}/more/timeline${queryString ? `?${queryString}` : ""}`,
  );
}

export function getClubAdminTimeline(clubId: string | number) {
  return getJson<ClubAdminTimelineResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/timeline`);
}

export function getClubAdminRoleManagement(clubId: string | number) {
  return getJson<ClubAdminRoleManagementResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/roles`);
}

export function getClubAdminRoleDetail(
  clubId: string | number,
  clubPositionId: string | number,
) {
  return getJson<ClubPositionDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/roles/${clubPositionId}`,
  );
}

export function createClubAdminRole(
  clubId: string | number,
  request: CreateClubPositionRequest,
) {
  return postJson<ClubPositionDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/roles`,
    request,
  );
}

export function updateClubAdminRole(
  clubId: string | number,
  clubPositionId: string | number,
  request: UpdateClubPositionRequest,
) {
  return putJson<ClubPositionDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/roles/${clubPositionId}`,
    request,
  );
}

export function deleteClubAdminRole(
  clubId: string | number,
  clubPositionId: string | number,
) {
  return deleteJson<boolean>(`/api/semo/v1/clubs/${clubId}/admin/more/roles/${clubPositionId}`);
}
