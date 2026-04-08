"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RouterLink } from "@/app/components/RouterLink";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type ClubFeatureSummary,
} from "@/app/lib/clubs";
import { overlayFadeMotion, popInMotion } from "@/app/lib/motion";
import { clubFeaturesQueryOptions, clubQueryKeys } from "@/app/lib/react-query/club/queries";
import { useBottomNavScrollDocking } from "@/app/components/useBottomNavScrollDocking";

type ClubBottomNavProps = {
  clubId: string;
  isAdmin?: boolean;
};

type NavItem = {
  key: "HOME" | "BOARD" | "SCHEDULE" | "MORE" | "PROFILE";
  label: string;
  icon: string;
  href: (clubId: string) => string | null;
};

const BASE_NAV_ITEMS: NavItem[] = [
  { key: "HOME", label: "홈", icon: "home", href: (clubId) => `/clubs/${clubId}` },
  { key: "BOARD", label: "게시판", icon: "leaderboard", href: (clubId) => `/clubs/${clubId}/board` },
  { key: "SCHEDULE", label: "일정", icon: "calendar_month", href: (clubId) => `/clubs/${clubId}/schedule` },
  { key: "MORE", label: "더보기", icon: "more_horiz", href: () => null },
  { key: "PROFILE", label: "프로필", icon: "person", href: (clubId) => `/clubs/${clubId}/profile` },
];

const FEATURE_ACCENT_CLASS: Record<string, string> = {
  ATTENDANCE: "bg-blue-50 text-blue-600",
  TIMELINE: "bg-indigo-50 text-indigo-600",
  NOTICE: "bg-blue-50 text-blue-600",
  POLL: "bg-sky-50 text-sky-600",
  SCHEDULE_MANAGE: "bg-cyan-50 text-cyan-600",
  MEMBER_DIRECTORY: "bg-rose-50 text-rose-600",
  TOURNAMENT_RECORD: "bg-emerald-50 text-emerald-600",
  BRACKET: "bg-amber-50 text-amber-700",
  FINANCE: "bg-emerald-50 text-emerald-700",
  FEEDBACK: "bg-violet-50 text-violet-700",
  TODO: "bg-amber-50 text-amber-700",
};

function getFeatureDisplayName(feature: ClubFeatureSummary) {
  return feature.displayName;
}

function stripQuery(path: string) {
  const [pathname] = path.split("?");
  return pathname ?? path;
}

const POPOVER_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
      delay: Math.min(index * 0.04, 0.18),
    },
  }),
};

const USER_ACTIVE_TEXT_CLASS = "text-[#135bec]";
const USER_INACTIVE_TEXT_CLASS = "text-slate-400";
const USER_ACTIVE_DOT_CLASS = "bg-[#135bec]";

export function ClubBottomNav({ clubId, isAdmin = false }: ClubBottomNavProps) {
  void isAdmin;
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const isDocked = useBottomNavScrollDocking({ routeKey: pathname });
  const [openMenuPathname, setOpenMenuPathname] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: featureData } = useQuery(clubFeaturesQueryOptions(clubId));
  const enabledFeatures: ClubFeatureSummary[] = (featureData ?? []).filter(
    (feature) => feature.enabled && feature.navigationScope !== "ADMIN_ONLY",
  );
  const menuItems = enabledFeatures;
  const isMoreOpen = openMenuPathname === pathname;
  const isFeatureRouteActive = menuItems.some((feature) => {
    const targetPath = stripQuery(feature.userPath);
    return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  });

  useEffect(() => {
    const onFeatureUpdate = () => {
      void queryClient.invalidateQueries({
        queryKey: clubQueryKeys.features(clubId),
      });
    };

    window.addEventListener("semo:club-features-updated", onFeatureUpdate);
    return () => {
      window.removeEventListener("semo:club-features-updated", onFeatureUpdate);
    };
  }, [clubId, queryClient]);

  useEffect(() => {
    if (!isMoreOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuPathname(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  const unifiedMotion = reduceMotion
    ? {
        initial: false,
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 10, scale: 0.93 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 10, scale: 0.93 },
        transition: { duration: 0.3, ease: "easeOut" as const },
      };

  const navItems = BASE_NAV_ITEMS;
  const floatingMenuClassName = "w-[clamp(280px,33vw,460px)] max-w-[calc(100vw-2.5rem)] gap-3";
  const dockedMenuContentClassName = "w-[clamp(360px,44vw,640px)] max-w-[calc(100vw-1.5rem)] gap-6";

  const renderButtons = () =>
    navItems.map((item) => {
      const href = item.href(clubId);
      const isMoreItem = item.key === "MORE";
      const isActive = isMoreItem
        ? isMoreOpen || isFeatureRouteActive
        : href
          ? pathname === href
          : false;
      const textClassName = isActive ? USER_ACTIVE_TEXT_CLASS : USER_INACTIVE_TEXT_CLASS;
      const iconClassName = isActive ? USER_ACTIVE_TEXT_CLASS : USER_INACTIVE_TEXT_CLASS;

      if (isMoreItem) {
        return (
          <motion.button
            key={item.key}
            type="button"
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            onClick={() =>
              setOpenMenuPathname((current) => (current === pathname ? null : pathname))
            }
            className={`flex h-10 w-10 touch-manipulation items-center justify-center transition ${textClassName}`}
            aria-expanded={isMoreOpen}
            aria-label={item.label}
          >
            <div className="relative flex h-10 w-10 items-center justify-center">
              <span className={`material-symbols-outlined text-[24px] ${iconClassName}`}>
                {item.icon}
              </span>
              {isActive ? (
                <motion.div
                  layoutId="club-nav-active-dot"
                  className={`absolute -right-0.5 top-1 size-2 rounded-full border-2 border-white ${USER_ACTIVE_DOT_CLASS}`}
                />
              ) : null}
            </div>
          </motion.button>
        );
      }

      if (!href) {
        return (
          <button
            key={item.key}
            type="button"
            className={`flex h-10 w-10 touch-manipulation items-center justify-center transition ${textClassName}`}
            aria-disabled="true"
            aria-label={item.label}
          >
            <span className={`material-symbols-outlined text-[24px] ${iconClassName}`}>
              {item.icon}
            </span>
          </button>
        );
      }

      return (
        <RouterLink
          key={item.key}
          href={href}
          className={`flex h-10 w-10 touch-manipulation items-center justify-center transition ${textClassName}`}
          aria-label={item.label}
        >
          <motion.div
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className="relative flex h-10 w-10 items-center justify-center"
          >
            <span
              className={`material-symbols-outlined text-[24px] ${iconClassName}`}
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            {isActive ? (
              <motion.div
                layoutId="club-nav-active-dot"
                className={`absolute -right-0.5 top-1 size-2 rounded-full border-2 border-white ${USER_ACTIVE_DOT_CLASS}`}
              />
            ) : null}
          </motion.div>
        </RouterLink>
      );
    });

  const FloatingMenu = (
    <nav
      className={`flex items-center justify-center rounded-full border border-white/70 bg-white/82 px-4 py-3 shadow-[0_18px_42px_rgba(15,23,42,0.12)] backdrop-blur-md ${floatingMenuClassName}`}
    >
      {renderButtons()}
    </nav>
  );

  const DockedMenu = (
    <nav className="flex w-full items-center justify-center border-t border-slate-200/70 bg-white/88 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-md">
      <div className={`flex items-center justify-center ${dockedMenuContentClassName}`}>
        {renderButtons()}
      </div>
    </nav>
  );

  return (
    <>
      <AnimatePresence initial={false}>
        {isMoreOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="더보기 닫기"
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setOpenMenuPathname(null)}
              {...overlayFadeMotion(reduceMotion)}
            />
            <motion.div
              className="pointer-events-none fixed inset-x-0 bottom-24 z-50 px-6"
              {...popInMotion(reduceMotion)}
            >
              <div className="pointer-events-auto mx-auto w-full max-w-sm">
                <div className="relative rounded-[32px] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                  <div className="grid grid-cols-3 gap-6">
                    {menuItems.map((item, index) => (
                      <motion.div
                        key={`${item.featureKey || item.userPath || "feature"}-${index}`}
                        custom={index}
                        variants={POPOVER_ITEM_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        <RouterLink
                          href={item.userPath}
                          className="flex flex-col items-center space-y-2"
                          onClick={() => setOpenMenuPathname(null)}
                        >
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                              FEATURE_ACCENT_CLASS[item.featureKey] ?? "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[28px]">
                              {item.iconName}
                            </span>
                          </div>
                          <span className="text-center text-[11px] font-semibold leading-4">
                            {getFeatureDisplayName(item)}
                          </span>
                        </RouterLink>
                      </motion.div>
                    ))}
                    {menuItems.length === 0 ? (
                      <div className="col-span-3 rounded-2xl bg-slate-50 px-4 py-5 text-center text-xs font-medium text-slate-500">
                        활성화된 기능이 없습니다.
                      </div>
                    ) : null}
                  </div>
                  <div className="absolute -bottom-2 left-[70%] h-5 w-5 -translate-x-1/2 rotate-45 border-b border-r border-slate-100 bg-white" />
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {isDocked ? (
          <motion.div
            key="club-bottom-docked"
            {...unifiedMotion}
            className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 flex flex-col items-stretch"
          >
            {DockedMenu}
          </motion.div>
        ) : (
          <motion.div
            key="club-bottom-floating"
            {...unifiedMotion}
            className="pointer-events-auto fixed bottom-0 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-4 pb-[calc(env(safe-area-inset-bottom)+12px)]"
          >
            {FloatingMenu}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
