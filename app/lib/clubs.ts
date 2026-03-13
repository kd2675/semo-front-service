import { getJson, postJson } from "@/app/lib/api";

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

export type ClubScheduleResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  months: Array<{
    id: string;
    label: string;
    shortLabel: string;
    year: number;
    month: number;
    leadingBlankDays: number;
    daysInMonth: number;
    defaultSelectedDay: number;
    days: Array<{
      day: number;
      events: Array<{
        id: string;
        icon: string;
        title: string;
        subtitle: string;
        startTime: string;
        durationLabel?: string | null;
        tone: "primary" | "amber" | "slate";
      }>;
    }>;
  }>;
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

export function getClubSchedule(clubId: string | number) {
  return getJson<ClubScheduleResponse>(`/api/semo/v1/clubs/${clubId}/schedule`);
}

export function getClubProfile(clubId: string | number) {
  return getJson<ClubProfileResponse>(`/api/semo/v1/clubs/${clubId}/profile`);
}
