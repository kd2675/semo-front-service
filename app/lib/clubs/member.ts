import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";

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

export type ClubAdminJoinRequest = {
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

export type ClubAdminJoinRequestsResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  requests: ClubAdminJoinRequest[];
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

export type UpdateClubMemberPositionsRequest = {
  clubPositionIds: number[];
};

export type SubmitClubJoinRequestRequest = {
  requestMessage?: string | null;
};

export type ClubJoinActionResponse = {
  clubId: number;
  clubName: string;
  actionType: "REQUESTED" | "JOINED" | "CANCELED" | "APPROVED" | "REJECTED" | string;
  joinStatus: "ACTIVE" | "PENDING" | "REJECTED" | "CANCELED" | string;
  clubJoinRequestId: number | null;
  clubMemberId: number | null;
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

export function getClubAdminMembers(clubId: string | number) {
  return getJson<ClubAdminMembersResponse>(`/api/semo/v1/clubs/${clubId}/admin/members`);
}

export function getClubAdminJoinRequests(clubId: string | number) {
  return getJson<ClubAdminJoinRequestsResponse>(`/api/semo/v1/clubs/${clubId}/admin/join-requests`);
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

export function submitClubJoinRequest(
  clubId: string | number,
  request: SubmitClubJoinRequestRequest,
) {
  return postJson<ClubJoinActionResponse>(
    `/api/semo/v1/clubs/${clubId}/join-requests`,
    request,
  );
}

export function cancelClubJoinRequest(clubId: string | number) {
  return deleteJson<ClubJoinActionResponse>(`/api/semo/v1/clubs/${clubId}/join-requests/me`);
}

export function reviewClubAdminJoinRequest(
  clubId: string | number,
  clubJoinRequestId: string | number,
  request: ReviewClubJoinRequestRequest,
) {
  return putJson<ClubJoinActionResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/join-requests/${clubJoinRequestId}/review`,
    request,
  );
}

export function getClubMemberDirectory(clubId: string | number) {
  return getJson<ClubMemberDirectoryResponse>(`/api/semo/v1/clubs/${clubId}/more/members`);
}

export function getClubAdminMemberDirectorySettings(clubId: string | number) {
  return getJson<ClubAdminMemberDirectorySettingsResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/members`,
  );
}

export function updateClubAdminMemberDirectorySettings(
  clubId: string | number,
  request: UpdateClubAdminMemberDirectorySettingsRequest,
) {
  return putJson<ClubAdminMemberDirectorySettingsResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/members`,
    request,
  );
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
