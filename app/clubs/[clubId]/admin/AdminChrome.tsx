"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { AdminBottomNav } from "./AdminBottomNav";

type AdminChromeProps = {
  clubId: string;
  children: React.ReactNode;
};

export function AdminChrome({ clubId, children }: AdminChromeProps) {
  const pathname = usePathname();
  const isMenuPage = pathname === `/clubs/${clubId}/admin/menu`;
  const isNoticeSettingsPage = pathname === `/clubs/${clubId}/admin/more/notices`;
  const isScheduleSettingsPage = pathname === `/clubs/${clubId}/admin/more/schedules`;
  const isPollSettingsPage = pathname === `/clubs/${clubId}/admin/more/polls`;
  const isRoleManagementPage = pathname.startsWith(`/clubs/${clubId}/admin/more/roles`);
  const fabClassName =
    isMenuPage || isNoticeSettingsPage || isScheduleSettingsPage || isPollSettingsPage || isRoleManagementPage
      ? "bottom-44"
      : undefined;

  return (
    <div
      style={
        {
          "--primary": "#ec5b13",
          "--background-light": "#f8f6f6",
        } as CSSProperties
      }
    >
      {children}
      <ClubModeSwitchFab clubId={clubId} mode="admin" className={fabClassName} />
      <AdminBottomNav clubId={clubId} />
    </div>
  );
}
