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
    author: string;
    timeAgo: string;
    category: "tournaments" | "matches" | "social";
  }>;
};

export type NoticeFeedCategory = "all" | string;

export type NoticeCategoryOption = {
  categoryKey: string;
  displayName: string;
  iconName: string;
  accentTone: string;
};

export type NoticeCategorySetting = NoticeCategoryOption & {
  visibleInTimeline: boolean;
};

export type ClubNoticeListItem = {
  noticeId: number;
  title: string;
  summary: string;
  authorDisplayName: string;
  authorRoleCode: string | null;
  categoryKey: string;
  categoryLabel: string;
  categoryIconName: string;
  categoryAccentTone: string;
  publishedAtLabel: string;
  timeAgo: string;
  pinned: boolean;
  scheduleAtLabel: string | null;
  locationLabel: string | null;
  canManage: boolean;
  linkedTargetType: "SCHEDULE_EVENT" | "SCHEDULE_VOTE" | null;
  linkedTargetId: number | null;
};

export type ClubNoticeFeedResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  notices: ClubNoticeListItem[];
  nextCursorPublishedAt: string | null;
  nextCursorNoticeId: number | null;
  hasNext: boolean;
};

export type ClubNoticeDetailResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  noticeId: number;
  title: string;
  content: string;
  categoryKey: string;
  categoryLabel: string;
  categoryIconName: string;
  categoryAccentTone: string;
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
  canManage: boolean;
  linkedTargetType: "SCHEDULE_EVENT" | "SCHEDULE_VOTE" | null;
  linkedTargetId: number | null;
};

export type UpsertClubNoticeRequest = {
  title: string;
  content: string;
  categoryKey?: string | null;
  locationLabel?: string | null;
  scheduleAt?: string | null;
  scheduleEndAt?: string | null;
  postToSchedule?: boolean;
  pinned?: boolean;
};

export type ClubNoticeUpsertResponse = {
  noticeId: number;
  title: string;
  categoryKey: string;
  scheduleAt: string | null;
  scheduleAtLabel: string | null;
  locationLabel: string | null;
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
  monthEvents: ClubScheduleEventSummary[];
  votes: ClubScheduleVoteSummary[];
};

export type ClubScheduleEventSummary = {
  eventId: number;
  title: string;
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
  linkedNoticeId: number | null;
  myParticipationStatus: "GOING" | "NOT_GOING" | null;
  goingCount: number;
  notGoingCount: number;
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
  voteStartDate: string;
  voteEndDate: string;
  votePeriodLabel: string;
  voteTimeLabel: string | null;
  optionCount: number;
  totalResponses: number;
  postedToBoard: boolean;
  linkedNoticeId: number | null;
  mySelectedOptionId: number | null;
  options: ClubScheduleVoteOptionSummary[];
  votingOpen: boolean;
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
  linkedNoticeId: number | null;
  myParticipationStatus: "GOING" | "NOT_GOING" | null;
  goingCount: number;
  notGoingCount: number;
  canManage: boolean;
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
};

export type ClubScheduleVoteDetailResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  voteId: number;
  title: string;
  voteStartDate: string;
  voteEndDate: string;
  votePeriodLabel: string;
  voteStartTime: string | null;
  voteEndTime: string | null;
  voteTimeLabel: string | null;
  postedToBoard: boolean;
  linkedNoticeId: number | null;
  mySelectedOptionId: number | null;
  totalResponses: number;
  options: ClubScheduleVoteOptionSummary[];
  canManage: boolean;
  votingOpen: boolean;
};

export type UpdateScheduleEventParticipationRequest = {
  participationStatus: "GOING" | "NOT_GOING";
};

export type UpsertScheduleVoteRequest = {
  title: string;
  voteStartDate: string;
  voteEndDate: string;
  voteStartTime?: string | null;
  voteEndTime?: string | null;
  optionLabels: string[];
  postToBoard?: boolean;
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

export type ClubFeatureSummary = {
  featureKey: string;
  displayName: string;
  description: string | null;
  iconName: string;
  enabled: boolean;
  userPath: string;
  adminPath: string;
};

export type ClubTimelineEntry = {
  noticeId: number;
  title: string;
  summary: string;
  categoryKey: string;
  categoryLabel: string;
  categoryIconName: string;
  categoryAccentTone: string;
  authorDisplayName: string;
  publishedAt: string;
  publishedAtLabel: string;
  timeAgo: string;
  pinned: boolean;
  scheduleAtLabel: string | null;
  locationLabel: string | null;
  linkedTargetType: "SCHEDULE_EVENT" | "SCHEDULE_VOTE" | null;
  linkedTargetId: number | null;
};

export type ClubTimelineResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  selectedCategoryKey: string | null;
  categories: NoticeCategoryOption[];
  entries: ClubTimelineEntry[];
  nextCursorPublishedAt: string | null;
  nextCursorNoticeId: number | null;
  hasNext: boolean;
};

export type ClubAdminTimelineResponse = {
  clubId: number;
  clubName: string;
  categories: NoticeCategorySetting[];
};

export type UpdateClubTimelineRequest = {
  visibleCategoryKeys: string[];
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

export type AttendanceSession = {
  sessionId: number;
  title: string;
  attendanceDateLabel: string;
  status: string;
  openAtLabel: string | null;
  closeAtLabel: string | null;
  checkedIn: boolean;
  checkedInAtLabel: string | null;
  canCheckIn: boolean;
  checkedInCount: number;
  memberCount: number;
};

export type AttendanceHistoryItem = {
  sessionId: number;
  title: string;
  attendanceDateLabel: string;
  status: string;
  checkedIn: boolean;
  checkedInAtLabel: string | null;
};

export type ClubAttendanceResponse = {
  clubId: number;
  clubName: string;
  featureEnabled: boolean;
  currentSession: AttendanceSession | null;
  recentSessions: AttendanceHistoryItem[];
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
  currentSession: AttendanceSession | null;
  members: AdminAttendanceMember[];
  recentSessions: AttendanceHistoryItem[];
};

export type CreateAttendanceSessionRequest = {
  title?: string | null;
  attendanceDate?: string | null;
};

export type AttendanceCheckInRequest = {
  sessionId: number;
};

export const MOCK_CLUB_FEATURES: ClubFeatureSummary[] = [
  {
    featureKey: "ATTENDANCE",
    displayName: "Attendance Check",
    description: "Check in members and manage attendance sessions.",
    iconName: "fact_check",
    enabled: true,
    userPath: "/clubs/tennis/more/attendance",
    adminPath: "/clubs/tennis/admin/more/attendance",
  },
  {
    featureKey: "TIMELINE",
    displayName: "Timeline",
    description: "Browse club activity through notice-based timeline cards.",
    iconName: "timeline",
    enabled: true,
    userPath: "/clubs/tennis/more/timeline",
    adminPath: "/clubs/tennis/admin/more/timeline",
  },
];

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
    category?: NoticeFeedCategory;
    query?: string;
    cursorPublishedAt?: string | null;
    cursorNoticeId?: number | null;
    size?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.category && options.category !== "all") {
    params.set("category", options.category);
  }
  if (options.query?.trim()) {
    params.set("query", options.query.trim());
  }
  if (options.cursorPublishedAt) {
    params.set("cursorPublishedAt", options.cursorPublishedAt);
  }
  if (options.cursorNoticeId) {
    params.set("cursorNoticeId", String(options.cursorNoticeId));
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
    `/api/semo/v1/clubs/${clubId}/board/notices/${noticeId}`,
  );
}

export function getNoticeCategoryOptions(clubId: string | number) {
  return getJson<NoticeCategoryOption[]>(
    `/api/semo/v1/clubs/${clubId}/board/notices/categories`,
  );
}

export function createClubNotice(
  clubId: string | number,
  request: UpsertClubNoticeRequest,
) {
  return postJson<ClubNoticeUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/board/notices`,
    request,
  );
}

export function updateClubNotice(
  clubId: string | number,
  noticeId: string | number,
  request: UpsertClubNoticeRequest,
) {
  return putJson<ClubNoticeUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/board/notices/${noticeId}`,
    request,
  );
}

export function deleteClubNotice(clubId: string | number, noticeId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/board/notices/${noticeId}`);
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
    `/api/semo/v1/clubs/${clubId}/schedule/votes/${voteId}`,
  );
}

export function createClubScheduleVote(
  clubId: string | number,
  request: UpsertScheduleVoteRequest,
) {
  return postJson<ScheduleVoteUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/votes`,
    request,
  );
}

export function updateClubScheduleVote(
  clubId: string | number,
  voteId: string | number,
  request: UpsertScheduleVoteRequest,
) {
  return putJson<ScheduleVoteUpsertResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/votes/${voteId}`,
    request,
  );
}

export function deleteClubScheduleVote(clubId: string | number, voteId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/schedule/votes/${voteId}`);
}

export function submitClubScheduleVoteSelection(
  clubId: string | number,
  voteId: string | number,
  request: SubmitScheduleVoteSelectionRequest,
) {
  return putJson<ClubScheduleVoteDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/votes/${voteId}/selection`,
    request,
  );
}

export function closeClubScheduleVote(clubId: string | number, voteId: string | number) {
  return putJson<ClubScheduleVoteDetailResponse>(
    `/api/semo/v1/clubs/${clubId}/schedule/votes/${voteId}/close`,
    undefined,
  );
}

export function getClubProfile(clubId: string | number) {
  return getJson<ClubProfileResponse>(`/api/semo/v1/clubs/${clubId}/profile`);
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

export function getClubAttendance(clubId: string | number) {
  return getJson<ClubAttendanceResponse>(`/api/semo/v1/clubs/${clubId}/more/attendance`);
}

export function checkInClubAttendance(
  clubId: string | number,
  request: AttendanceCheckInRequest,
) {
  return postJson<AttendanceSession>(
    `/api/semo/v1/clubs/${clubId}/more/attendance/check-in`,
    request,
  );
}

export function getClubAdminAttendance(clubId: string | number) {
  return getJson<ClubAdminAttendanceResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/attendance`);
}

export function getClubTimeline(
  clubId: string | number,
  options: {
    category?: string;
    cursorPublishedAt?: string | null;
    cursorNoticeId?: number | null;
    size?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.category && options.category !== "all") {
    params.set("category", options.category);
  }
  if (options.cursorPublishedAt) {
    params.set("cursorPublishedAt", options.cursorPublishedAt);
  }
  if (options.cursorNoticeId) {
    params.set("cursorNoticeId", String(options.cursorNoticeId));
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

export function updateClubAdminTimeline(
  clubId: string | number,
  request: UpdateClubTimelineRequest,
) {
  return putJson<ClubAdminTimelineResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/timeline`,
    request,
  );
}

export function createClubAttendanceSession(
  clubId: string | number,
  request: CreateAttendanceSessionRequest = {},
) {
  return postJson<AttendanceSession>(
    `/api/semo/v1/clubs/${clubId}/admin/more/attendance/sessions`,
    request,
  );
}

export function closeClubAttendanceSession(clubId: string | number, sessionId: number) {
  return postJson<AttendanceSession>(
    `/api/semo/v1/clubs/${clubId}/admin/more/attendance/sessions/${sessionId}/close`,
    {},
  );
}
