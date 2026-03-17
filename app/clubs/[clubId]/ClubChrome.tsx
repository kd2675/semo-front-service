"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";

type ClubChromeProps = {
  clubId: string;
  children: React.ReactNode;
};

export function ClubChrome({ clubId, children }: ClubChromeProps) {
  const pathname = usePathname();
  const isAdminRoute =
    pathname === `/clubs/${clubId}/admin` || pathname.startsWith(`/clubs/${clubId}/admin/`);

  return (
    <div
      style={
        {
          "--primary": "#135bec",
          "--background-light": "#f6f6f8",
        } as CSSProperties
      }
    >
      {children}
      {!isAdminRoute ? <ClubBottomNav clubId={clubId} /> : null}
    </div>
  );
}
