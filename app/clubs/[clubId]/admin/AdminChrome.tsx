"use client";

import { AdminBottomNav } from "./AdminBottomNav";

type AdminChromeProps = {
  clubId: string;
  children: React.ReactNode;
};

export function AdminChrome({ clubId, children }: AdminChromeProps) {
  return (
    <div className="semo-admin-theme min-h-screen">
      {children}
      <AdminBottomNav clubId={clubId} />
    </div>
  );
}
