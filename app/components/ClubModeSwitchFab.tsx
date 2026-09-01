"use client";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { RouterLink } from "@/app/components/RouterLink";
import {
  FAB_RIGHT_OFFSET_CLASS_NAME,
  MODE_SWITCH_FAB_BOTTOM_CLASS_NAME,
} from "@/app/lib/fab";

type ClubModeSwitchFabProps = {
  clubId: string;
  mode: "user" | "admin";
  className?: string;
};

export function ClubModeSwitchFab({ clubId, mode, className }: ClubModeSwitchFabProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const isAdminMode = mode === "admin";
  const adminAccentClassName = "border-[#ec5b13]/20 bg-white text-[#ec5b13]";
  const userAccentClassName = "border-[#135bec]/20 bg-white text-[#135bec]";

  return (
    <motion.div
      className={`fixed ${MODE_SWITCH_FAB_BOTTOM_CLASS_NAME} ${FAB_RIGHT_OFFSET_CLASS_NAME} z-40 ${className ?? ""}`.trim()}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9, y: 8 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.22, ease: "easeOut" }}
    >
      <RouterLink
        href={isAdminMode ? `/clubs/${clubId}` : `/clubs/${clubId}/admin`}
        aria-label={isAdminMode ? "유저 모드로 전환" : "관리자 모드로 전환"}
        title={isAdminMode ? "관리자 모드 종료" : "관리자 모드"}
        className={`flex size-12 items-center justify-center rounded-full border shadow-[var(--shadow-floating)] backdrop-blur-md transition-transform hover:scale-105 active:scale-95 sm:size-14 ${
          isAdminMode ? userAccentClassName : adminAccentClassName
        }`}
      >
        <span className="material-symbols-outlined text-[24px] sm:text-[26px]" aria-hidden="true">
          {isAdminMode ? "exit_to_app" : "admin_panel_settings"}
        </span>
      </RouterLink>
    </motion.div>
  );
}
