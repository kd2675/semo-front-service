"use client";

import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { AdminBottomNav } from "./AdminBottomNav";

type AdminChromeProps = {
  clubId: string;
  children: React.ReactNode;
};

export function AdminChrome({ clubId, children }: AdminChromeProps) {
  return (
    <div className="semo-admin-theme min-h-screen">
      {children}
      <ClubModeSwitchFab clubId={clubId} mode="admin" />
      <AdminBottomNav clubId={clubId} />
    </div>
  );
}
