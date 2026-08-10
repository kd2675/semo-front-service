import { getJson, putJson } from "@/app/lib/api";

export type ClubNotificationSummary = {
  unreadCount: number;
};

export type ClubNotificationItem = {
  notificationId: number;
  clubId: number | null;
  notificationType: string;
  title: string;
  message: string;
  resourceType: string | null;
  resourceId: number | null;
  targetPath: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string | null;
  createdAtLabel: string;
};

export type ClubNotificationFeed = {
  unreadCount: number;
  unreadOnly: boolean;
  hasNext: boolean;
  nextCursor: number | null;
  items: ClubNotificationItem[];
};

export type ClubNotificationReadResult = {
  notificationId: number | null;
  updatedCount: number;
  unreadCount: number;
};

export function getNotificationSummary() {
  return getJson<ClubNotificationSummary>("/api/semo/v1/notifications/summary");
}

export function getNotifications({
  unreadOnly = false,
  beforeId,
  size = 20,
}: {
  unreadOnly?: boolean;
  beforeId?: number | null;
  size?: number;
} = {}) {
  const params = new URLSearchParams({
    unreadOnly: String(unreadOnly),
    size: String(size),
  });
  if (beforeId != null) {
    params.set("beforeId", String(beforeId));
  }
  return getJson<ClubNotificationFeed>(`/api/semo/v1/notifications?${params.toString()}`);
}

export function markNotificationRead(notificationId: number) {
  return putJson<ClubNotificationReadResult>(
    `/api/semo/v1/notifications/${notificationId}/read`,
    {},
  );
}

export function markAllNotificationsRead() {
  return putJson<ClubNotificationReadResult>("/api/semo/v1/notifications/read-all", {});
}
