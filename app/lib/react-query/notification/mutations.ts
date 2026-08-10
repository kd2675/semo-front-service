import { mutationOptions } from "@tanstack/react-query";

import { markAllNotificationsRead, markNotificationRead } from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export function markNotificationReadMutationOptions() {
  return mutationOptions({
    mutationFn: async (notificationId: number) =>
      requireApiData(
        await markNotificationRead(notificationId),
        "알림을 읽음 처리하지 못했습니다.",
      ),
  });
}

export function markAllNotificationsReadMutationOptions() {
  return mutationOptions({
    mutationFn: async () =>
      requireApiData(
        await markAllNotificationsRead(),
        "알림을 모두 읽음 처리하지 못했습니다.",
      ),
  });
}
