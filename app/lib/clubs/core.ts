import { getJson, patchJson, postJson, putJson } from "@/app/lib/api";
import type { ActivityCategoryKey, ActivityTagKey, AffiliationTypeKey } from "@/app/lib/club-classification";
import type { RegionScope } from "@/app/lib/regions";
import type { ClubScheduleVoteOptionSummary } from "./schedule";

export type CreateClubRequest = {
  name: string;
  description?: string | null;
  categoryKey?: string | null;
  activityCategory?: ActivityCategoryKey | null;
  activityTags?: ActivityTagKey[];
  affiliationType?: AffiliationTypeKey | null;
  visibilityStatus?: "PUBLIC" | "PRIVATE";
  membershipPolicy?: "APPROVAL" | "OPEN";
  regionScope?: RegionScope;
  regionDepth1Code?: string | null;
  regionDepth2Code?: string | null;
  regionDepth1Name?: string | null;
  regionDepth2Name?: string | null;
  fileName?: string | null;
};

export type ClubCreateResponse = {
  clubId: number;
  name: string;
  summary: string | null;
  description: string | null;
  categoryKey: string | null;
  activityCategory: ActivityCategoryKey | null;
  activityTags: ActivityTagKey[];
  affiliationType: AffiliationTypeKey | null;
  visibilityStatus: string;
  membershipPolicy: string;
  regionScope: RegionScope;
  regionDepth1Code: string | null;
  regionDepth2Code: string | null;
  regionDepth1Name: string | null;
  regionDepth2Name: string | null;
  regionLabel: string | null;
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
  activityCategory: ActivityCategoryKey | null;
  activityTags: ActivityTagKey[];
  affiliationType: AffiliationTypeKey | null;
  regionScope: RegionScope;
  regionDepth1Code: string | null;
  regionDepth2Code: string | null;
  regionDepth1Name: string | null;
  regionDepth2Name: string | null;
  regionLabel: string | null;
  roleCode: string;
  admin: boolean;
  fileName: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
};

export type ClubDiscoverSummary = {
  clubId: number;
  name: string;
  summary: string | null;
  description: string | null;
  categoryKey: string | null;
  activityCategory: ActivityCategoryKey | null;
  activityTags: ActivityTagKey[];
  affiliationType: AffiliationTypeKey | null;
  visibilityStatus: "PUBLIC" | "PRIVATE" | string;
  membershipPolicy: "APPROVAL" | "OPEN" | string;
  regionScope: RegionScope;
  regionDepth1Code: string | null;
  regionDepth2Code: string | null;
  regionDepth1Name: string | null;
  regionDepth2Name: string | null;
  regionLabel: string | null;
  activeMemberCount: number;
  fileName: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  joinStatus: "NONE" | "PENDING" | "REJECTED" | "CANCELED" | string;
  clubJoinRequestId: number | null;
  recommendedByCategory: boolean;
  recommendedByTags: boolean;
};

export type ClubDiscoverResponse = {
  query: string;
  recommended: boolean;
  recommendationLabel: string;
  totalCount: number;
  clubs: ClubDiscoverSummary[];
};

export type UpdateClubSettingsRequest = {
  activityCategory?: ActivityCategoryKey | null;
  activityTags?: ActivityTagKey[];
  affiliationType?: AffiliationTypeKey | null;
  regionScope: RegionScope;
  regionDepth1Code?: string | null;
  regionDepth2Code?: string | null;
  regionDepth1Name?: string | null;
  regionDepth2Name?: string | null;
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

export function createClub(request: CreateClubRequest) {
  return postJson<ClubCreateResponse>("/api/semo/v1/clubs", request);
}

export function getDiscoverClubs(query?: string) {
  const params = new URLSearchParams();
  if (query?.trim()) {
    params.set("query", query.trim());
  }
  const queryString = params.toString();
  return getJson<ClubDiscoverResponse>(`/api/semo/v1/clubs/discover${queryString ? `?${queryString}` : ""}`);
}

export function getMyClubs() {
  return getJson<MyClubSummary[]>("/api/semo/v1/clubs/my");
}

export function getMyClub(clubId: string | number) {
  return getJson<MyClubSummary>(`/api/semo/v1/clubs/${clubId}`);
}

export function updateClubSettings(clubId: string | number, request: UpdateClubSettingsRequest) {
  return patchJson<MyClubSummary>(`/api/semo/v1/clubs/${clubId}/admin/settings`, request);
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
