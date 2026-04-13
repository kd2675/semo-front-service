import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";
import type { TournamentSummary } from "./competition";
import type { ClubScheduleEventSummary, ClubScheduleVoteSummary } from "./schedule";

type ClubId = string | number;

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

export function getClubBoard(clubId: ClubId) {
  return getJson<ClubBoardResponse>(`/api/semo/v1/clubs/${clubId}/board`);
}

export function getClubNoticeFeed(
  clubId: ClubId,
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

export function getClubNoticeDetail(clubId: ClubId, noticeId: string | number) {
  return getJson<ClubNoticeDetailResponse>(`/api/semo/v1/clubs/${clubId}/more/notices/${noticeId}`);
}

export function getClubNoticeHome(clubId: ClubId, options: { pinnedOnly?: boolean } = {}) {
  const params = new URLSearchParams();
  if (options.pinnedOnly) {
    params.set("pinnedOnly", "true");
  }
  const queryString = params.toString();
  return getJson<ClubNoticeHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/notices${queryString ? `?${queryString}` : ""}`);
}

export function createClubNotice(clubId: ClubId, request: UpsertClubNoticeRequest) {
  return postJson<ClubNoticeUpsertResponse>(`/api/semo/v1/clubs/${clubId}/more/notices`, request);
}

export function updateClubNotice(clubId: ClubId, noticeId: string | number, request: UpsertClubNoticeRequest) {
  return putJson<ClubNoticeUpsertResponse>(`/api/semo/v1/clubs/${clubId}/more/notices/${noticeId}`, request);
}

export function deleteClubNotice(clubId: ClubId, noticeId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/more/notices/${noticeId}`);
}

export function recordClubBoardItemRead(clubId: ClubId, boardItemId: string | number) {
  return postJson<BoardItemReadResponse>(`/api/semo/v1/clubs/${clubId}/board/items/${boardItemId}/read`, {});
}

export function getClubBoardItemReadStatus(clubId: ClubId, boardItemId: string | number) {
  return getJson<BoardItemReadStatusResponse>(`/api/semo/v1/clubs/${clubId}/board/items/${boardItemId}/read-status`);
}
