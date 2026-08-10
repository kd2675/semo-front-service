import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";
import type { ClubNoticeListItem } from "./board";
import type { TournamentSummary } from "./competition";

type ClubId = string | number;

export type ScheduleParticipationStatus = "GOING" | "NOT_GOING" | "CANCELED";
export type ScheduleAttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

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
  myParticipationStatus: ScheduleParticipationStatus | null;
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
  myParticipationStatus: ScheduleParticipationStatus | null;
  goingCount: number;
  notGoingCount: number;
  goingParticipants: {
    clubProfileId: number;
    displayName: string;
    avatarImageUrl: string | null;
    avatarThumbnailUrl: string | null;
  }[];
  attendanceEnabled: boolean;
  canManageAttendance: boolean;
  myAttendanceStatus: ScheduleAttendanceStatus | null;
  myCheckedInAtLabel: string | null;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  unmarkedCount: number;
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
  participationStatus: ScheduleParticipationStatus;
};

export type ScheduleEventAttendanceSummary = {
  goingCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  unmarkedCount: number;
};

export type ScheduleEventAttendanceMember = {
  clubProfileId: number;
  displayName: string;
  roleCode: string;
  participationStatus: ScheduleParticipationStatus | null;
  attendanceStatus: ScheduleAttendanceStatus | null;
  checkedInAtLabel: string | null;
  attendanceNote: string | null;
};

export type ScheduleEventAttendanceResponse = {
  clubId: number;
  clubName: string;
  eventId: number;
  eventTitle: string;
  dateLabel: string;
  timeLabel: string | null;
  canManage: boolean;
  summary: ScheduleEventAttendanceSummary;
  members: ScheduleEventAttendanceMember[];
};

export type ScheduleAttendanceEventSummary = {
  eventId: number;
  title: string;
  dateLabel: string;
  timeLabel: string | null;
  participationStatus: ScheduleParticipationStatus | null;
  attendanceStatus: ScheduleAttendanceStatus | null;
  checkedInAtLabel: string | null;
  goingCount: number;
  attendedCount: number;
};

export type ClubScheduleAttendanceSummaryResponse = {
  clubId: number;
  clubName: string;
  enabled: boolean;
  nextEvent: ScheduleAttendanceEventSummary | null;
  recentEvents: ScheduleAttendanceEventSummary[];
};

export type UpdateScheduleEventAttendanceRequest = {
  attendanceStatus: ScheduleAttendanceStatus | "UNMARKED";
  note?: string | null;
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

export type ClubScheduleVoteSummaryResponse = {
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

export function getClubScheduleAttendanceSummary(clubId: ClubId) {
  return getJson<ClubScheduleAttendanceSummaryResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/attendance/summary`,
  );
}

export function getClubScheduleEventAttendance(clubId: ClubId, eventId: string | number) {
  return getJson<ScheduleEventAttendanceResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/events/${eventId}/attendance`,
  );
}

export function updateClubScheduleEventAttendance(
  clubId: ClubId,
  eventId: string | number,
  clubProfileId: string | number,
  request: UpdateScheduleEventAttendanceRequest,
) {
  return putJson<ScheduleEventAttendanceResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/events/${eventId}/attendance/${clubProfileId}`,
    request,
  );
}

export function getClubScheduleVoteDetail(clubId: ClubId, voteId: string | number) {
  return getJson<ClubScheduleVoteDetailResponse>(`/api/semo/v1/clubs/${clubId}/schedule/votes/${voteId}`);
}

export function createClubScheduleVote(clubId: ClubId, request: UpsertScheduleVoteRequest) {
  return postJson<ScheduleVoteUpsertResponse>(`/api/semo/v1/clubs/${clubId}/schedule/votes`, request);
}

export function updateClubScheduleVote(clubId: ClubId, voteId: string | number, request: UpsertScheduleVoteRequest) {
  return putJson<ScheduleVoteUpsertResponse>(`/api/semo/v1/clubs/${clubId}/schedule/votes/${voteId}`, request);
}

export function deleteClubScheduleVote(clubId: ClubId, voteId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/schedule/votes/${voteId}`);
}

export function submitClubScheduleVoteSelection(
  clubId: ClubId,
  voteId: string | number,
  request: SubmitScheduleVoteSelectionRequest,
) {
  return putJson<ClubScheduleVoteDetailResponse>(`/api/semo/v1/clubs/${clubId}/schedule/votes/${voteId}/selection`, request);
}

export function closeClubScheduleVote(clubId: ClubId, voteId: string | number) {
  return putJson<ClubScheduleVoteDetailResponse>(`/api/semo/v1/clubs/${clubId}/schedule/votes/${voteId}/close`, undefined);
}

export function getClubScheduleVoteSummary(clubId: ClubId, options: { query?: string } = {}) {
  const params = new URLSearchParams();
  if (options.query?.trim()) {
    params.set("query", options.query.trim());
  }
  const queryString = params.toString();
  return getJson<ClubScheduleVoteSummaryResponse>(`/api/semo/v1/clubs/${clubId}/schedule/votes/summary${queryString ? `?${queryString}` : ""}`);
}
