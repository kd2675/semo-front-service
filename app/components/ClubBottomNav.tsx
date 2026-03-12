"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { overlayFadeMotion, popInMotion } from "@/app/lib/motion";

type ClubBottomNavProps = {
  clubId: string;
  isAdmin?: boolean;
};

type NavItem = {
  label: string;
  icon: string;
  href: (clubId: string) => string | null;
};

type MoreMenuItem = {
  label: string;
  icon: string;
  accentClassName: string;
  href: (clubId: string) => string;
};

const BASE_NAV_ITEMS: NavItem[] = [
  { label: "Home", icon: "home", href: (clubId) => `/clubs/${clubId}` },
  { label: "Board", icon: "leaderboard", href: (clubId) => `/clubs/${clubId}/board` },
  { label: "Schedule", icon: "calendar_month", href: (clubId) => `/clubs/${clubId}/schedule` },
  { label: "More", icon: "more_horiz", href: () => null },
  { label: "Profile", icon: "person", href: (clubId) => `/clubs/${clubId}/profile` },
];

const MORE_MENU_ITEMS: MoreMenuItem[] = [
  {
    label: "Match Records",
    icon: "assignment",
    accentClassName: "bg-blue-50 text-blue-600",
    href: (clubId) => `/clubs/${clubId}/board`,
  },
  {
    label: "Leaderboard",
    icon: "leaderboard",
    accentClassName: "bg-orange-50 text-orange-500",
    href: (clubId) => `/clubs/${clubId}`,
  },
  {
    label: "Finance",
    icon: "payments",
    accentClassName: "bg-emerald-50 text-emerald-500",
    href: (clubId) => `/clubs/${clubId}/profile`,
  },
  {
    label: "Clubs",
    icon: "apartment",
    accentClassName: "bg-purple-50 text-purple-500",
    href: () => "/",
  },
  {
    label: "Training",
    icon: "bolt",
    accentClassName: "bg-rose-50 text-rose-500",
    href: (clubId) => `/clubs/${clubId}/schedule`,
  },
];

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

export function ClubBottomNav({ clubId, isAdmin = false }: ClubBottomNavProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [isDocked, setIsDocked] = useState(() => persistedDockedState);
  const [openMenuPathname, setOpenMenuPathname] = useState<string | null>(null);
  const isMoreOpen = openMenuPathname === pathname;

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

  const navItems = isAdmin
    ? [
        ...BASE_NAV_ITEMS,
        { label: "Admin", icon: "admin_panel_settings", href: (nextClubId: string) => `/clubs/${nextClubId}/admin` },
      ]
    : BASE_NAV_ITEMS;

  const renderButtons = () =>
    navItems.map((item) => {
      const href = item.href(clubId);
      const isMoreItem = item.label === "More";
      const isActive = isMoreItem ? isMoreOpen : href ? pathname === href : false;
      const textClassName =
        item.label === "Admin"
          ? isActive
            ? "text-rose-500"
            : "text-rose-300 hover:text-rose-400"
          : isActive
            ? "text-[var(--primary)]"
            : "text-slate-400 hover:text-slate-700";

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
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              {isMoreOpen ? (
                <motion.div
                  layoutId="club-nav-active-dot"
                  className="absolute -right-0.5 top-1 size-2 rounded-full border-2 border-white bg-[var(--primary)]"
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
            className={`flex h-10 w-10 touch-manipulation items-center justify-center transition ${textClassName}`}
            aria-disabled="true"
            aria-label={item.label}
          >
            <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
          </button>
        );
      }

      return (
        <Link
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
              className="material-symbols-outlined text-[24px]"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            {isActive ? (
              <motion.div
                layoutId={
                  item.label === "Profile" ? "club-nav-profile-indicator" : "club-nav-active-dot"
                }
                className={
                  item.label === "Profile"
                    ? "absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--primary)]"
                    : "absolute -right-0.5 top-1 size-2 rounded-full border-2 border-white bg-[var(--primary)]"
                }
              />
            ) : null}
          </motion.div>
        </Link>
      );
    });

  const FloatingMenu = (
    <nav className="flex w-[clamp(280px,33vw,460px)] max-w-[calc(100vw-2.5rem)] items-center justify-center gap-3 rounded-full border border-white/70 bg-white/82 px-4 py-3 shadow-[0_18px_42px_rgba(15,23,42,0.12)] backdrop-blur-md">
      {renderButtons()}
    </nav>
  );

  const DockedMenu = (
    <nav className="flex w-full items-center justify-center border-t border-slate-200/70 bg-white/88 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-md">
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
                    {MORE_MENU_ITEMS.map((item, index) => (
                      <motion.div
                        key={item.label}
                        custom={index}
                        variants={POPOVER_ITEM_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                      >
                        <Link
                          href={item.href(clubId)}
                          className="flex flex-col items-center space-y-2"
                          onClick={() => setOpenMenuPathname(null)}
                        >
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.accentClassName}`}
                          >
                            <span className="material-symbols-outlined text-[28px]">
                              {item.icon}
                            </span>
                          </div>
                          <span className="text-center text-[11px] font-semibold leading-4">
                            {item.label}
                          </span>
                        </Link>
                      </motion.div>
                    ))}
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
