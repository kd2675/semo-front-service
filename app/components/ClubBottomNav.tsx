"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RouterLink } from "@/app/components/RouterLink";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MoreNavigationMenu } from "@/app/components/MoreNavigationMenu";
import { buildUserMoreNavigation } from "@/app/lib/featureNavigation";
import { overlayFadeMotion, popInMotion } from "@/app/lib/motion";
import { clubFeaturesQueryOptions, clubQueryKeys } from "@/app/lib/react-query/club/queries";
import { useBottomNavScrollDocking } from "@/app/hooks/useBottomNavScrollDocking";
import { useDialogFocusManagement } from "@/app/hooks/useDialogFocusManagement";

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

function stripQuery(path: string) {
  const [pathname] = path.split("?");
  return pathname ?? path;
}

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
  const menuItems = useMemo(
    () => buildUserMoreNavigation(featureData ?? [], clubId),
    [clubId, featureData],
  );
  const isMoreOpen = openMenuPathname === pathname;
  const isFeatureRouteActive = menuItems.some((feature) => {
    const targetPath = stripQuery(feature.href);
    return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  });
  const moreMenuRef = useDialogFocusManagement<HTMLDivElement>({
    active: isMoreOpen,
    onDismiss: () => setOpenMenuPathname(null),
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
          ? item.key === "HOME"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`)
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
            className={`semo-icon-control touch-manipulation transition ${textClassName}`}
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            aria-label={item.label}
          >
            <div className="relative flex h-11 w-11 items-center justify-center">
              <span className={`material-symbols-outlined text-[24px] ${iconClassName}`} aria-hidden="true">
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
            className={`semo-icon-control touch-manipulation transition ${textClassName}`}
            aria-disabled="true"
            aria-label={item.label}
          >
            <span className={`material-symbols-outlined text-[24px] ${iconClassName}`} aria-hidden="true">
              {item.icon}
            </span>
          </button>
        );
      }

      return (
        <RouterLink
          key={item.key}
          href={href}
          className={`semo-icon-control touch-manipulation transition ${textClassName}`}
          aria-label={item.label}
        >
          <motion.div
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className="relative flex h-11 w-11 items-center justify-center"
          >
            <span
              className={`material-symbols-outlined text-[24px] ${iconClassName}`}
              aria-hidden="true"
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
            <motion.div
              aria-hidden="true"
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setOpenMenuPathname(null)}
              {...overlayFadeMotion(reduceMotion)}
            />
            <motion.div
              className="pointer-events-none fixed inset-x-0 bottom-24 z-50 px-6"
              {...popInMotion(reduceMotion)}
            >
              <div className="pointer-events-auto mx-auto w-full max-w-sm">
                <div
                  ref={moreMenuRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="클럽 기능 더보기"
                  tabIndex={-1}
                  className="relative max-h-[min(70vh,36rem)] overflow-y-auto rounded-[var(--radius-modal)] bg-white p-4 shadow-[var(--shadow-modal)]"
                >
                  <div className="mb-4 flex items-start justify-between gap-4 px-1">
                    <div>
                      <p className="text-base font-bold text-slate-900">클럽 운영 도구</p>
                      <p className="mt-1 text-xs text-slate-500">게시물은 게시판, 일정과 투표는 캘린더에서 확인하세요.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenMenuPathname(null)}
                      className="semo-icon-control -mr-2 -mt-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="더보기 닫기"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                  </div>
                  <MoreNavigationMenu
                    items={menuItems}
                    mode="user"
                    onNavigate={() => setOpenMenuPathname(null)}
                  />
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
