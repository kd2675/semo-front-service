"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MoreNavigationMenu } from "@/app/components/MoreNavigationMenu";
import { RouterLink } from "@/app/components/RouterLink";
import { useBottomNavScrollDocking } from "@/app/hooks/useBottomNavScrollDocking";
import { useDialogFocusManagement } from "@/app/hooks/useDialogFocusManagement";
import { buildAdminMoreNavigation } from "@/app/lib/featureNavigation";
import { overlayFadeMotion, popInMotion } from "@/app/lib/motion";
import { clubFeaturesQueryOptions, clubQueryKeys } from "@/app/lib/react-query/club/queries";

type AdminBottomNavProps = {
  clubId: string;
};

type AdminNavItem = {
  key: "HOME" | "MENU" | "MEMBERS" | "MORE" | "STATS";
  label: string;
  icon: string;
  href?: (clubId: string) => string;
  exact?: boolean;
};

const ADMIN_ITEMS: AdminNavItem[] = [
  { key: "HOME", label: "홈", icon: "home", href: (clubId) => `/clubs/${clubId}/admin`, exact: true },
  { key: "MENU", label: "메뉴", icon: "apps", href: (clubId) => `/clubs/${clubId}/admin/menu` },
  { key: "MEMBERS", label: "멤버", icon: "groups", href: (clubId) => `/clubs/${clubId}/admin/members` },
  { key: "MORE", label: "더보기", icon: "more_horiz" },
  { key: "STATS", label: "통계", icon: "insights", href: (clubId) => `/clubs/${clubId}/admin/stats` },
];

const ADMIN_ACTIVE_TEXT_CLASS = "text-[var(--color-admin-primary)]";
const ADMIN_INACTIVE_TEXT_CLASS = "text-slate-400";

function stripQuery(path: string) {
  const [pathname] = path.split("?");
  return pathname ?? path;
}

export function AdminBottomNav({ clubId }: AdminBottomNavProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const isDocked = useBottomNavScrollDocking({ routeKey: pathname });
  const [openMenuPathname, setOpenMenuPathname] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: featureData } = useQuery(clubFeaturesQueryOptions(clubId));
  const menuItems = useMemo(
    () => buildAdminMoreNavigation(featureData ?? [], clubId),
    [clubId, featureData],
  );
  const isMoreOpen = openMenuPathname === pathname;
  const moreMenuRef = useDialogFocusManagement<HTMLDivElement>({
    active: isMoreOpen,
    onDismiss: () => setOpenMenuPathname(null),
  });
  const isFeatureRouteActive = menuItems.some((item) => {
    const targetPath = stripQuery(item.href);
    return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
  });

  useEffect(() => {
    const onFeatureUpdate = () => {
      void queryClient.invalidateQueries({ queryKey: clubQueryKeys.features(clubId) });
    };
    window.addEventListener("semo:club-features-updated", onFeatureUpdate);
    return () => window.removeEventListener("semo:club-features-updated", onFeatureUpdate);
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

  const renderButtons = () =>
    ADMIN_ITEMS.map((item) => {
      const href = item.href?.(clubId) ?? null;
      const isMoreItem = item.key === "MORE";
      const isActive = isMoreItem
        ? isMoreOpen || isFeatureRouteActive
        : href
          ? item.exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`)
          : false;
      const textClassName = isActive ? ADMIN_ACTIVE_TEXT_CLASS : ADMIN_INACTIVE_TEXT_CLASS;

      if (isMoreItem) {
        return (
          <motion.button
            key={item.key}
            type="button"
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            onClick={() => setOpenMenuPathname((current) => (current === pathname ? null : pathname))}
            className={`semo-icon-control relative touch-manipulation transition ${textClassName}`}
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            aria-label={item.label}
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">{item.icon}</span>
            {isActive ? (
              <motion.span
                layoutId="admin-nav-active-dot"
                className="absolute right-1 top-1 size-2 rounded-full border-2 border-white bg-[var(--color-admin-primary)]"
              />
            ) : null}
          </motion.button>
        );
      }

      return href ? (
        <RouterLink
          key={item.key}
          href={href}
          className={`semo-icon-control touch-manipulation transition ${textClassName}`}
          aria-label={item.label}
        >
          <motion.span className="relative flex size-11 items-center justify-center" whileTap={reduceMotion ? undefined : { scale: 0.92 }}>
            <span
              className="material-symbols-outlined text-[24px]"
              aria-hidden="true"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            {isActive ? (
              <motion.span
                layoutId="admin-nav-active-dot"
                className="absolute right-0 top-0 size-2 rounded-full border-2 border-white bg-[var(--color-admin-primary)]"
              />
            ) : null}
          </motion.span>
        </RouterLink>
      ) : null;
    });

  const floatingMenu = (
    <nav className="flex w-[clamp(280px,33vw,460px)] max-w-[calc(100vw-2.5rem)] items-center justify-center gap-3 rounded-full border border-white/70 bg-white/85 px-4 py-3 shadow-[var(--shadow-floating)] backdrop-blur-md">
      {renderButtons()}
    </nav>
  );
  const dockedMenu = (
    <nav className="flex w-full items-center justify-center border-t border-slate-200/70 bg-white/90 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-md">
      <div className="flex w-[clamp(360px,44vw,640px)] max-w-[calc(100vw-1.5rem)] items-center justify-center gap-6">
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
              className="pointer-events-none fixed inset-x-0 bottom-24 z-50 px-4"
              {...popInMotion(reduceMotion)}
            >
              <div className="pointer-events-auto mx-auto w-full max-w-lg">
                <div
                  ref={moreMenuRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label="관리자 운영 기능 더보기"
                  tabIndex={-1}
                  className="max-h-[min(72vh,42rem)] overflow-y-auto rounded-[var(--radius-modal)] bg-white p-4 shadow-[var(--shadow-modal)]"
                >
                  <div className="mb-4 flex items-start justify-between gap-4 px-1">
                    <div>
                      <p className="text-base font-bold text-slate-900">운영 영역</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">기능 순서는 메뉴 설정에서 관리하고, 여기서는 업무 영역으로 이동합니다.</p>
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
                    mode="admin"
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
            key="admin-bottom-docked"
            {...unifiedMotion}
            className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 flex flex-col items-stretch"
          >
            {dockedMenu}
          </motion.div>
        ) : (
          <motion.div
            key="admin-bottom-floating"
            {...unifiedMotion}
            className="pointer-events-auto fixed bottom-0 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center pb-[calc(env(safe-area-inset-bottom)+12px)]"
          >
            {floatingMenu}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
