import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";
import type { ClubNoticeListItem } from "./board";
import type { TournamentSummary } from "./competition";

type ClubId = string | number;

export type ClubScheduleResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  canCreateSchedule: boolean;
  canCreatePoll: boolean;
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

export function getClubSchedule(clubId: ClubId, params?: { year?: number; month?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.year != null) {
    searchParams.set("year", String(params.year));
  }
  if (params?.month != null) {
    searchParams.set("month", String(params.month));
  }
  const queryString = searchParams.toString();
  return getJson<ClubScheduleResponse>(`/api/semo/v1/clubs/${clubId}/schedule${queryString ? `?${queryString}` : ""}`);
}

export function getClubScheduleHome(clubId: ClubId) {
  return getJson<ClubScheduleHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/schedules`);
}

export function getClubScheduleEventDetail(clubId: ClubId, eventId: string | number) {
  return getJson<ClubScheduleEventDetailResponse>(`/api/semo/v1/clubs/${clubId}/schedule/events/${eventId}`);
}

export function createClubScheduleEvent(clubId: ClubId, request: UpsertScheduleEventRequest) {
  return postJson<ScheduleEventUpsertResponse>(`/api/semo/v1/clubs/${clubId}/schedule/events`, request);
}

export function updateClubScheduleEvent(clubId: ClubId, eventId: string | number, request: UpsertScheduleEventRequest) {
  return putJson<ScheduleEventUpsertResponse>(`/api/semo/v1/clubs/${clubId}/schedule/events/${eventId}`, request);
}

export function deleteClubScheduleEvent(clubId: ClubId, eventId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/schedule/events/${eventId}`);
}

export function updateClubScheduleEventParticipation(
  clubId: ClubId,
  eventId: string | number,
  request: UpdateScheduleEventParticipationRequest,
) {
  return putJson<ClubScheduleEventDetailResponse>(`/api/semo/v1/clubs/${clubId}/schedule/events/${eventId}/participation`, request);
}

export function getClubScheduleVoteDetail(clubId: ClubId, voteId: string | number) {
  return getJson<ClubScheduleVoteDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/polls/${voteId}`);
}

export function createClubScheduleVote(clubId: ClubId, request: UpsertScheduleVoteRequest) {
  return postJson<ScheduleVoteUpsertResponse>(`/api/semo/v1/clubs/${clubId}/more/polls`, request);
}

export function updateClubScheduleVote(clubId: ClubId, voteId: string | number, request: UpsertScheduleVoteRequest) {
  return putJson<ScheduleVoteUpsertResponse>(`/api/semo/v1/clubs/${clubId}/more/polls/${voteId}`, request);
}

export function deleteClubScheduleVote(clubId: ClubId, voteId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/more/polls/${voteId}`);
}

export function submitClubScheduleVoteSelection(
  clubId: ClubId,
  voteId: string | number,
  request: SubmitScheduleVoteSelectionRequest,
) {
  return putJson<ClubScheduleVoteDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/polls/${voteId}/selection`, request);
}

export function closeClubScheduleVote(clubId: ClubId, voteId: string | number) {
  return putJson<ClubScheduleVoteDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/polls/${voteId}/close`, undefined);
}

export function getClubPollHome(clubId: ClubId, options: { query?: string } = {}) {
  const params = new URLSearchParams();
  if (options.query?.trim()) {
    params.set("query", options.query.trim());
  }
  const queryString = params.toString();
  return getJson<ClubPollHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/polls${queryString ? `?${queryString}` : ""}`);
}
