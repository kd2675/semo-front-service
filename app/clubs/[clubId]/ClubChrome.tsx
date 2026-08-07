"use client";

import { usePathname } from "next/navigation";
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
    <div className="semo-user-theme min-h-screen">
      {children}
      {!isAdminRoute ? <ClubBottomNav clubId={clubId} /> : null}
    </div>
  );
}
