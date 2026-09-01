"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { RouterLink } from "@/app/components/RouterLink";
import { notificationSummaryQueryOptions } from "@/app/lib/react-query/notification/queries";

export function NotificationBellLink() {
  const pathname = usePathname();
  const { data } = useQuery(notificationSummaryQueryOptions());
  const unreadCount = data?.unreadCount ?? 0;
  const href = `/notifications?from=${encodeURIComponent(pathname)}`;

  return (
    <RouterLink
      href={href}
      aria-label={unreadCount > 0 ? `알림함, 읽지 않은 알림 ${unreadCount}건` : "알림함"}
      className="semo-icon-control relative text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
    >
      <span
        className="material-symbols-outlined text-[23px]"
        aria-hidden="true"
        style={unreadCount > 0 ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        notifications
      </span>
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full border-2 border-white bg-rose-500 px-1 text-center text-xs font-bold leading-4 text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </RouterLink>
  );
}
