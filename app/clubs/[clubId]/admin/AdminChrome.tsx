"use client";

import { usePathname } from "next/navigation";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { pageTransitionMotion } from "@/app/lib/motion";

import { AdminBottomNav } from "./AdminBottomNav";

type AdminChromeProps = {
  clubId: string;
  children: React.ReactNode;
};

export function AdminChrome({ clubId, children }: AdminChromeProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useHydrationSafeReducedMotion();

  return (
    <div className="semo-admin-theme min-h-screen">
      <motion.div
        key={pathname}
        className="semo-route-stage"
        {...pageTransitionMotion(prefersReducedMotion)}
      >
        {children}
      </motion.div>
      <AdminBottomNav clubId={clubId} />
    </div>
  );
}
