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
      <ClubModeSwitchFab clubId={clubId} mode="admin" className={isMenuPage ? "bottom-44" : undefined} />
      <AdminBottomNav clubId={clubId} />
    </div>
  );
}
