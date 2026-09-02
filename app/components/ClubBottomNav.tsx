"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { RouterLink } from "@/app/components/RouterLink";
import { MoreNavigationMenu } from "@/app/components/MoreNavigationMenu";
import {
  buildDelegatedAdminNavigation,
  buildUserMoreNavigation,
  decorateMoreNavigationItems,
  type MoreNavigationItem,
} from "@/app/lib/featureNavigation";
import { overlayFadeMotion, popInMotion } from "@/app/lib/motion";
import { markClubMoreFeatureUsedMutationOptions } from "@/app/lib/react-query/club/mutations";
import { clubMoreSummaryQueryOptions, clubQueryKeys } from "@/app/lib/react-query/club/queries";
import { useBottomNavScrollDocking } from "@/app/hooks/useBottomNavScrollDocking";
import { useDialogFocusManagement } from "@/app/hooks/useDialogFocusManagement";

type ClubBottomNavProps = {
  clubId: string;
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

const USER_ACTIVE_TEXT_CLASS = "text-[var(--primary)]";
const USER_INACTIVE_TEXT_CLASS = "text-slate-500";

export function ClubBottomNav({ clubId }: ClubBottomNavProps) {
  const pathname = usePathname();
  const reduceMotion = useHydrationSafeReducedMotion();
  const isDocked = useBottomNavScrollDocking({ routeKey: pathname });
  const [openMenuPathname, setOpenMenuPathname] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: moreSummary } = useQuery(clubMoreSummaryQueryOptions(clubId));
  const usageMutation = useMutation({
    ...markClubMoreFeatureUsedMutationOptions(clubId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clubQueryKeys.moreSummary(clubId) });
    },
  });
  const menuItems = useMemo(
    () => {
      const features = moreSummary?.features ?? [];
      const statuses = moreSummary?.featureStatuses ?? [];
      const userItems = decorateMoreNavigationItems(
        buildUserMoreNavigation(features, clubId),
        statuses,
        "user",
      );
      if (!moreSummary || moreSummary.fullAdmin) return userItems;
      return [
        ...userItems,
        ...decorateMoreNavigationItems(
          buildDelegatedAdminNavigation(features, clubId, moreSummary.adminToolFeatureKeys),
          statuses,
          "admin",
        ),
      ];
    },
    [clubId, moreSummary],
  );
  const isMoreOpen = openMenuPathname === pathname;
  const morePendingCount = menuItems.reduce((total, item) => total + (item.pendingCount ?? 0), 0);
  const isFeatureRouteActive = menuItems.some((feature) => {
    const targetPath = stripQuery(feature.href);
    return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  });
  const moreMenuRef = useDialogFocusManagement<HTMLDivElement>({
    active: isMoreOpen,
    onDismiss: () => setOpenMenuPathname(null),
  });

  const handleFeatureNavigate = (item: MoreNavigationItem) => {
    const featureKey = item.featureKeys[0];
    if (featureKey) {
      usageMutation.mutate(featureKey);
    }
    setOpenMenuPathname(null);
  };

  useEffect(() => {
    const onFeatureUpdate = () => {
      void queryClient.invalidateQueries({
        queryKey: clubQueryKeys.moreSummary(clubId),
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
  const floatingMenuClassName = "w-[clamp(340px,38vw,480px)] max-w-[calc(100vw-1rem)] justify-around";
  const dockedMenuContentClassName = "w-[clamp(360px,44vw,640px)] max-w-[calc(100vw-1rem)] justify-around";

  const renderButtons = () =>
    navItems.map((item) => {
      const href = item.href(clubId);
      const isMoreItem = item.key === "MORE";
      const isActive = isMoreItem
        ? isMoreOpen || isFeatureRouteActive
        : href
          ? item.key === "HOME"
            ? pathname === href || pathname === `${href}/growth`
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
            className={`semo-nav-item relative touch-manipulation transition ${textClassName}`}
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            aria-label={morePendingCount > 0 ? `${item.label}, 확인할 항목 ${morePendingCount}건` : item.label}
          >
            <span className="semo-nav-icon" data-active={isActive}>
              <span className={`material-symbols-outlined text-[24px] ${iconClassName}`} aria-hidden="true">
                {item.icon}
              </span>
              {morePendingCount > 0 ? (
                <span className="absolute -right-1 -top-0.5 min-w-5 rounded-full border-2 border-white bg-rose-500 px-1 text-center text-xs font-bold leading-4 text-white">
                  {morePendingCount > 99 ? "99+" : morePendingCount}
                </span>
              ) : null}
            </span>
            <span>{item.label}</span>
          </motion.button>
        );
      }

      if (!href) {
        return (
          <button
            key={item.key}
            type="button"
            className={`semo-nav-item touch-manipulation transition ${textClassName}`}
            aria-disabled="true"
            aria-label={item.label}
          >
            <span className={`material-symbols-outlined text-[24px] ${iconClassName}`} aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      }

      return (
        <RouterLink
          key={item.key}
          href={href}
          className={`semo-nav-item touch-manipulation transition ${textClassName}`}
          aria-label={item.label}
          aria-current={isActive ? "page" : undefined}
        >
          <motion.div
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className="semo-nav-icon"
            data-active={isActive}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${iconClassName}`}
              aria-hidden="true"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
          </motion.div>
          <span>{item.label}</span>
        </RouterLink>
      );
    });

  const FloatingMenu = (
    <nav
      aria-label="모임 주요 화면"
      className={`flex items-center rounded-[var(--radius-modal)] border border-white/70 bg-white/88 px-2 py-1.5 shadow-[var(--shadow-floating)] backdrop-blur-md ${floatingMenuClassName}`}
    >
      {renderButtons()}
    </nav>
  );

  const DockedMenu = (
    <nav aria-label="모임 주요 화면" className="flex w-full items-center justify-center border-t border-slate-200/70 bg-white/92 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+6px)] backdrop-blur-md">
      <div className={`flex items-center ${dockedMenuContentClassName}`}>
        {renderButtons()}
      </div>
    </nav>
  );

  const DesktopMenu = (
    <nav aria-label="모임 주요 화면" className="semo-desktop-nav-rail">
      {renderButtons()}
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
              className="pointer-events-none fixed inset-x-0 bottom-24 z-50 px-6 xl:inset-0 xl:flex xl:items-center xl:justify-center"
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
                      <p className="text-base font-bold text-slate-900">모임 운영 도구</p>
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
                    onNavigate={handleFeatureNavigate}
                  />
                  {moreSummary?.fullAdmin ? (
                    <RouterLink
                      href={`/clubs/${clubId}/admin`}
                      onClick={() => setOpenMenuPathname(null)}
                      className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-control)] border border-[var(--color-admin-primary)]/20 bg-orange-50 px-4 text-sm font-bold text-[var(--color-admin-primary)] transition hover:bg-orange-100"
                    >
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[19px]" aria-hidden="true">admin_panel_settings</span>
                        운영자 모드로 전환
                      </span>
                      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
                    </RouterLink>
                  ) : null}
                  <RouterLink
                    href={`/clubs/${clubId}/more`}
                    onClick={() => setOpenMenuPathname(null)}
                    className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    전체 더보기 허브
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
                  </RouterLink>
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
            className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 flex flex-col items-stretch xl:hidden"
          >
            {DockedMenu}
          </motion.div>
        ) : (
          <motion.div
            key="club-bottom-floating"
            {...unifiedMotion}
            className="pointer-events-auto fixed bottom-0 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-4 pb-[calc(env(safe-area-inset-bottom)+12px)] xl:hidden"
          >
            {FloatingMenu}
          </motion.div>
        )}
      </AnimatePresence>
      {DesktopMenu}
    </>
  );
}
