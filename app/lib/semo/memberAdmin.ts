import { getJson, postJson, putJson, deleteJson } from "@/app/lib/api";
import type { ClubJoinActionResponse } from "./club";

type ClubId = string | number;

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

export type ClubJoinRequestInboxItem = {
  clubJoinRequestId: number;
  clubId: number;
  profileId: number;
  displayName: string;
  tagline: string | null;
  profileColor: string | null;
  requestMessage: string | null;
  requestedAt: string | null;
  requestedAtLabel: string | null;
  requestStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED" | string;
};

export type ClubJoinRequestInboxResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  pendingRequestCount: number;
  requestedTodayCount: number;
  messageAttachedCount: number;
  latestRequestedAtLabel: string | null;
  requests: ClubJoinRequestInboxItem[];
};

export type ClubAdminActivityItem = {
  activityId: number;
  actorDisplayName: string;
  actorAvatarLabel: string;
  actorPositions: ClubAdminActivityPosition[];
  subject: string;
  detail: string;
  status: "SUCCESS" | "FAIL" | string;
  errorMessage: string | null;
  createdAt: string | null;
  createdAtLabel: string | null;
};

export type ClubAdminActivityPosition = {
  clubPositionId: number;
  positionCode: string;
  displayName: string;
};

export type ClubAdminActivityFeedResponse = {
  clubId: number;
  clubName: string;
  selectedPositionId: number | null;
  positionFilters: ClubAdminActivityPosition[];
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

export type ReviewClubJoinRequestRequest = {
  requestStatus: "APPROVED" | "REJECTED" | string;
};

export type ClubMemberActivityEntry = {
  activityId: number;
  actorDisplayName: string;
  actorAvatarLabel: string;
  subject: string;
  detail: string;
  status: "SUCCESS" | "FAIL" | string;
  createdAt: string | null;
  createdAtLabel: string | null;
};

export type ClubMemberActivityResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  entries: ClubMemberActivityEntry[];
  nextCursorCreatedAt: string | null;
  nextCursorActivityId: number | null;
  hasNext: boolean;
};

export type ClubMemberDirectorySettings = {
  showPositions: boolean;
  showTagline: boolean;
  showRecentActivity: boolean;
};

export type ClubMemberDirectoryActivity = {
  subject: string;
  detail: string;
  createdAt: string | null;
  createdAtLabel: string | null;
};

export type ClubMemberDirectoryMember = {
  clubMemberId: number;
  clubProfileId: number;
  displayName: string;
  avatarImageUrl: string | null;
  roleLabel: string | null;
  tagline: string | null;
  positions: ClubPositionSummary[];
  recentActivity: ClubMemberDirectoryActivity | null;
};

export type ClubMemberDirectoryResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  featureEnabled: boolean;
  totalMemberCount: number;
  settings: ClubMemberDirectorySettings;
  members: ClubMemberDirectoryMember[];
};

export type ClubAdminMemberDirectorySettingsResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  featureEnabled: boolean;
  totalMemberCount: number;
  settings: ClubMemberDirectorySettings;
  previewMembers: ClubMemberDirectoryMember[];
};

export type UpdateClubAdminMemberDirectorySettingsRequest = {
  showPositions: boolean;
  showTagline: boolean;
  showRecentActivity: boolean;
};

export type ClubAdminRoleManagementResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  roleManagementEnabled: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  positions: ClubPositionSummary[];
  permissionGroups: ClubPermissionGroup[];
};

export type ClubPositionDetailResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  roleManagementEnabled: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAssign: boolean;
  position: ClubPositionSummary;
  permissionGroups: ClubPermissionGroup[];
};

export type ClubPositionHistoryItem = {
  positionHistoryId: number;
  clubMemberId: number;
  clubProfileId: number | null;
  memberDisplayName: string;
  clubPositionId: number;
  positionCode: string;
  positionDisplayName: string;
  startedAt: string | null;
  startedAtLabel: string | null;
  endedAt: string | null;
  endedAtLabel: string | null;
  active: boolean;
  deleted: boolean;
  deleteReason: string | null;
};

export type ClubPositionHistoryResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  histories: ClubPositionHistoryItem[];
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

export function getClubJoinRequestInbox(clubId: ClubId) {
  return getJson<ClubJoinRequestInboxResponse>(`/api/semo/v1/clubs/${clubId}/more/join-requests`);
}

export function getClubAdminMembers(clubId: ClubId) {
  return getJson<ClubAdminMembersResponse>(`/api/semo/v1/clubs/${clubId}/admin/members`);
}

export function getClubAdminJoinRequestInbox(clubId: ClubId) {
  return getJson<ClubJoinRequestInboxResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/join-requests`);
}

export function getClubAdminActivities(
  clubId: ClubId,
  options: { size?: number; cursorCreatedAt?: string | null; cursorActivityId?: number | null; positionId?: number | null } = {},
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
  if (options.positionId != null) {
    params.set("positionId", String(options.positionId));
  }
  const queryString = params.toString();
  return getJson<ClubAdminActivityFeedResponse>(`/api/semo/v1/clubs/${clubId}/admin/activity${queryString ? `?${queryString}` : ""}`);
}

export function updateClubAdminMemberRole(clubId: ClubId, clubMemberId: string | number, request: UpdateClubAdminMemberRoleRequest) {
  return putJson<ClubAdminMember>(`/api/semo/v1/clubs/${clubId}/admin/members/${clubMemberId}/role`, request);
}

export function updateClubAdminMemberStatus(
  clubId: ClubId,
  clubMemberId: string | number,
  request: UpdateClubAdminMemberStatusRequest,
) {
  return putJson<ClubAdminMember>(`/api/semo/v1/clubs/${clubId}/admin/members/${clubMemberId}/status`, request);
}

export function updateClubAdminMemberPositions(
  clubId: ClubId,
  clubMemberId: string | number,
  request: UpdateClubMemberPositionsRequest,
) {
  return putJson<ClubAdminMember>(`/api/semo/v1/clubs/${clubId}/admin/members/${clubMemberId}/positions`, request);
}

export function approveClubAdminMember(clubId: ClubId, clubMemberId: string | number) {
  return postJson<ClubAdminMember>(`/api/semo/v1/clubs/${clubId}/admin/members/${clubMemberId}/approve`, undefined);
}

export function reviewClubAdminJoinRequestInbox(
  clubId: ClubId,
  clubJoinRequestId: string | number,
  request: ReviewClubJoinRequestRequest,
) {
  return putJson<ClubJoinActionResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/join-requests/${clubJoinRequestId}/review`,
    request,
  );
}

export function getClubMemberDirectory(clubId: ClubId) {
  return getJson<ClubMemberDirectoryResponse>(`/api/semo/v1/clubs/${clubId}/more/members`);
}

export function getClubMemberActivity(
  clubId: ClubId,
  options: { cursorCreatedAt?: string | null; cursorActivityId?: number | null; size?: number } = {},
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
  return getJson<ClubMemberActivityResponse>(`/api/semo/v1/clubs/${clubId}/profile/activity${queryString ? `?${queryString}` : ""}`);
}

export function getClubAdminMemberDirectorySettings(clubId: ClubId) {
  return getJson<ClubAdminMemberDirectorySettingsResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/members`);
}

export function updateClubAdminMemberDirectorySettings(
  clubId: ClubId,
  request: UpdateClubAdminMemberDirectorySettingsRequest,
) {
  return putJson<ClubAdminMemberDirectorySettingsResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/members`, request);
}

export function getClubAdminRoleManagement(clubId: ClubId) {
  return getJson<ClubAdminRoleManagementResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/roles`);
}

export function getClubAdminRoleDetail(clubId: ClubId, clubPositionId: string | number) {
  return getJson<ClubPositionDetailResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/roles/${clubPositionId}`);
}

export function getClubAdminRoleHistory(clubId: ClubId) {
  return getJson<ClubPositionHistoryResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/roles/history`);
}

export function createClubAdminRole(clubId: ClubId, request: CreateClubPositionRequest) {
  return postJson<ClubPositionDetailResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/roles`, request);
}

export function updateClubAdminRole(clubId: ClubId, clubPositionId: string | number, request: UpdateClubPositionRequest) {
  return putJson<ClubPositionDetailResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/roles/${clubPositionId}`, request);
}

export function deleteClubAdminRole(clubId: ClubId, clubPositionId: string | number) {
  return deleteJson<boolean>(`/api/semo/v1/clubs/${clubId}/admin/more/roles/${clubPositionId}`);
}
