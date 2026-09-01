"use client";

import { usePathname } from "next/navigation";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";

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
        initial={{ opacity: prefersReducedMotion ? 1 : 0.72 }}
        animate={{ opacity: 1 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.24, ease: "easeOut" }}
      >
        {children}
      </motion.div>
      <AdminBottomNav clubId={clubId} />
    </div>
  );
}
