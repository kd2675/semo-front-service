"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

type ClubModeSwitchFabProps = {
  clubId: string;
  mode: "user" | "admin";
  className?: string;
};

export function ClubModeSwitchFab({ clubId, mode, className }: ClubModeSwitchFabProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const isAdminMode = mode === "admin";

  return (
    <motion.div
      className={`fixed bottom-24 right-6 z-40 ${className ?? ""}`.trim()}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9, y: 8 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
    >
      <Link
        href={isAdminMode ? `/clubs/${clubId}` : `/clubs/${clubId}/admin`}
        aria-label={isAdminMode ? "유저 모드로 전환" : "관리자 모드로 전환"}
        title={isAdminMode ? "Exit Admin" : "Admin Mode"}
        className={`flex size-14 items-center justify-center rounded-full border shadow-xl backdrop-blur-md transition-transform hover:scale-105 active:scale-95 ${
          isAdminMode
            ? "border-[#135bec]/20 bg-white text-[#135bec]"
            : "border-[var(--primary)]/20 bg-white text-[var(--primary)]"
        }`}
      >
        <span className="material-symbols-outlined text-[26px]">
          {isAdminMode ? "exit_to_app" : "admin_panel_settings"}
        </span>
      </Link>
    </motion.div>
  );
}
