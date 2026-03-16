"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getClubFeatures,
  MOCK_CLUB_FEATURES,
  type ClubFeatureSummary,
} from "@/app/lib/clubs";
import { overlayFadeMotion, popInMotion } from "@/app/lib/motion";

type AdminBottomNavProps = {
  clubId: string;
};

type AdminNavItem = {
  label: string;
  icon: string;
  href?: (clubId: string) => string;
  exact?: boolean;
};

const ADMIN_ITEMS: AdminNavItem[] = [
  { label: "Home", icon: "home", href: (clubId: string) => `/clubs/${clubId}/admin`, exact: true },
  { label: "Menu", icon: "apps", href: (clubId: string) => `/clubs/${clubId}/admin/menu` },
  { label: "Members", icon: "groups", href: (clubId: string) => `/clubs/${clubId}/admin/members` },
  { label: "More", icon: "more_horiz" },
  { label: "Stats", icon: "insights", href: (clubId: string) => `/clubs/${clubId}/admin/stats` },
];

const FEATURE_ACCENT_CLASS: Record<string, string> = {
  ATTENDANCE: "bg-orange-50 text-orange-500",
};

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

const DOCK_TRIGGER_OFFSET_PX = 120;
let persistedDockedState = true;
const ADMIN_ACTIVE_TEXT_CLASS = "text-[#ec5b13]";
const ADMIN_INACTIVE_TEXT_CLASS = "text-slate-400";
const ADMIN_ACTIVE_DOT_CLASS = "bg-[#ec5b13]";

export function AdminBottomNav({ clubId }: AdminBottomNavProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [isDocked, setIsDocked] = useState(() => persistedDockedState);
  const [openMenuPathname, setOpenMenuPathname] = useState<string | null>(null);
  const [enabledFeatures, setEnabledFeatures] = useState<ClubFeatureSummary[]>([]);
  const isMoreOpen = openMenuPathname === pathname;
  const isFeatureRouteActive = enabledFeatures.some((feature) => pathname === feature.adminPath);

  useEffect(() => {
    let cancelled = false;

    const loadFeatures = async () => {
      if (Number.isNaN(Number(clubId))) {
        setEnabledFeatures(
          MOCK_CLUB_FEATURES.map((feature) => ({
            ...feature,
            userPath: `/clubs/${clubId}/more/attendance`,
            adminPath: `/clubs/${clubId}/admin/more/attendance`,
          })),
        );
        return;
      }

      const result = await getClubFeatures(clubId);
      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setEnabledFeatures([]);
        return;
      }

      setEnabledFeatures(result.data.filter((feature) => feature.enabled));
    };

    void loadFeatures();

    const onFeatureUpdate = () => {
      void loadFeatures();
    };

    window.addEventListener("semo:club-features-updated", onFeatureUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("semo:club-features-updated", onFeatureUpdate);
    };
  }, [clubId]);

  useEffect(() => {
    persistedDockedState = isDocked;
  }, [isDocked]);

  useEffect(() => {
    let rafId = 0;

    const recalcDocking = () => {
      const doc = document.documentElement;
      const body = document.body;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const contentHeight = Math.max(doc.scrollHeight, body.scrollHeight);
      const hasScrollableContent = contentHeight > viewportHeight + 2;
      const atBottom = scrollTop + viewportHeight >= contentHeight - DOCK_TRIGGER_OFFSET_PX;
      setIsDocked(!hasScrollableContent || atBottom);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(recalcDocking);
    };

    recalcDocking();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

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

  const renderButtons = () =>
    ADMIN_ITEMS.map((item) => {
      const href = item.href?.(clubId);
      const isMoreItem = item.label === "More";
      const isActive = Boolean(
        isMoreItem
          ? isMoreOpen || isFeatureRouteActive
          : href &&
              (item.exact
                ? pathname === href
                : pathname === href || pathname.startsWith(`${href}/`)),
      );
      const textClassName = isActive ? ADMIN_ACTIVE_TEXT_CLASS : ADMIN_INACTIVE_TEXT_CLASS;
      const iconClassName = isActive ? ADMIN_ACTIVE_TEXT_CLASS : ADMIN_INACTIVE_TEXT_CLASS;

      if (isMoreItem) {
        return (
          <motion.button
            key={item.label}
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
                  layoutId="admin-nav-active-dot"
                  className={`absolute -right-0.5 top-1 size-2 rounded-full border-2 border-white ${ADMIN_ACTIVE_DOT_CLASS}`}
                />
              ) : null}
            </div>
          </motion.button>
        );
      }

      if (!href) {
        return (
          <button
            key={item.label}
            type="button"
            aria-disabled="true"
            className={`flex h-10 w-10 touch-manipulation items-center justify-center transition ${textClassName}`}
          >
            <div className="relative flex h-10 w-10 items-center justify-center">
              <span className={`material-symbols-outlined text-[24px] ${iconClassName}`}>
                {item.icon}
              </span>
            </div>
          </button>
        );
      }

      return (
        <RouterLink
          key={item.label}
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
                layoutId="admin-nav-active-dot"
                className={`absolute -right-0.5 top-1 size-2 rounded-full border-2 border-white ${ADMIN_ACTIVE_DOT_CLASS}`}
              />
            ) : null}
          </motion.div>
        </RouterLink>
      );
    });

  const FloatingMenu = (
    <nav className="flex w-[clamp(280px,33vw,460px)] max-w-[calc(100vw-2rem)] items-center justify-center gap-4 rounded-full border border-white/70 bg-white/82 px-5 py-3 shadow-[0_18px_42px_rgba(15,23,42,0.12)] backdrop-blur-md">
      {renderButtons()}
    </nav>
  );

  const DockedMenu = (
    <nav className="flex w-full items-center justify-center border-t border-slate-200/70 bg-white/88 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-md">
      <div className="flex w-[clamp(360px,44vw,640px)] max-w-[calc(100vw-1rem)] items-center justify-center gap-6">
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
                    {enabledFeatures.map((item, index) => (
                      <motion.div
                        key={item.featureKey}
                        custom={index}
                        variants={POPOVER_ITEM_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        <RouterLink
                          href={item.adminPath}
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
                            {item.displayName}
                          </span>
                        </RouterLink>
                      </motion.div>
                    ))}
                    {enabledFeatures.length === 0 ? (
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
            key="admin-bottom-docked"
            {...unifiedMotion}
            className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 flex flex-col items-stretch"
          >
            {DockedMenu}
          </motion.div>
        ) : (
          <motion.div
            key="admin-bottom-floating"
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
