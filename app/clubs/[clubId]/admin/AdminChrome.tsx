"use client";

import type { CSSProperties } from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { AdminBottomNav } from "./AdminBottomNav";

type AdminChromeProps = {
  clubId: string;
  children: React.ReactNode;
};

export function AdminChrome({ clubId, children }: AdminChromeProps) {
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
      <ClubModeSwitchFab clubId={clubId} mode="admin" />
      <AdminBottomNav clubId={clubId} />
    </div>
  );
}
