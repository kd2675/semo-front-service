"use client";

import { usePathname } from "next/navigation";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";
import { pageTransitionMotion } from "@/app/lib/motion";

type ClubChromeProps = {
  clubId: string;
  children: React.ReactNode;
};

export function ClubChrome({ clubId, children }: ClubChromeProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useHydrationSafeReducedMotion();
  const isAdminRoute =
    pathname === `/clubs/${clubId}/admin` || pathname.startsWith(`/clubs/${clubId}/admin/`);

  return (
    <div className="semo-user-theme min-h-screen">
      {isAdminRoute ? (
        children
      ) : (
        <motion.div
          key={pathname}
          className="semo-route-stage"
          {...pageTransitionMotion(prefersReducedMotion)}
        >
          {children}
        </motion.div>
      )}
      {!isAdminRoute ? <ClubBottomNav clubId={clubId} /> : null}
    </div>
  );
}
