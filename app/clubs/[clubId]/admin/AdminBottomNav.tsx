"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RouterLink } from "@/app/components/RouterLink";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  getClubFeatures,
  updateClubFeatures,
  type ClubFeatureSummary,
} from "@/app/lib/clubs";
import { overlayFadeMotion, popInMotion } from "@/app/lib/motion";
import { useBottomNavScrollDocking } from "@/app/components/useBottomNavScrollDocking";

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
  { key: "HOME", label: "홈", icon: "home", href: (clubId: string) => `/clubs/${clubId}/admin`, exact: true },
  { key: "MENU", label: "메뉴", icon: "apps", href: (clubId: string) => `/clubs/${clubId}/admin/menu` },
  { key: "MEMBERS", label: "멤버", icon: "groups", href: (clubId: string) => `/clubs/${clubId}/admin/members` },
  { key: "MORE", label: "더보기", icon: "more_horiz" },
  { key: "STATS", label: "통계", icon: "insights", href: (clubId: string) => `/clubs/${clubId}/admin/stats` },
];

const FEATURE_ACCENT_CLASS: Record<string, string> = {
  ATTENDANCE: "bg-orange-50 text-orange-500",
  TIMELINE: "bg-orange-50 text-[#ec5b13]",
  NOTICE: "bg-orange-50 text-[#ec5b13]",
  POLL: "bg-amber-50 text-[#ec5b13]",
  SCHEDULE_MANAGE: "bg-cyan-50 text-cyan-600",
};

const FEATURE_NAME_BY_KEY: Record<string, string> = {
  ATTENDANCE: "출석 체크",
  TIMELINE: "타임라인",
  NOTICE: "공지",
  POLL: "투표",
  SCHEDULE_MANAGE: "일정 관리",
};

function getFeatureDisplayName(feature: ClubFeatureSummary) {
  return FEATURE_NAME_BY_KEY[feature.featureKey] ?? feature.displayName;
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

const ADMIN_ACTIVE_TEXT_CLASS = "text-[#ec5b13]";
const ADMIN_INACTIVE_TEXT_CLASS = "text-slate-400";
const ADMIN_ACTIVE_DOT_CLASS = "bg-[#ec5b13]";

type AdminMoreSortableItemProps = {
  feature: ClubFeatureSummary;
};

function AdminMoreSortableItem({ feature }: AdminMoreSortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: feature.featureKey });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative flex flex-col items-center space-y-2 ${
        isDragging ? "opacity-0" : ""
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        className="absolute -right-1 -top-1 z-10 flex h-5 w-5 touch-none shrink-0 cursor-grab items-center justify-center rounded-full border border-[#ec5b13]/30 bg-white text-[#ec5b13] shadow-sm transition hover:bg-[#ec5b13]/10 active:cursor-grabbing"
        aria-label={`${getFeatureDisplayName(feature)} 순서 변경 핸들`}
        title="드래그해서 순서를 변경합니다."
      >
        <span className="font-mono text-[10px] font-bold tracking-[-0.2em]">::</span>
      </button>
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          FEATURE_ACCENT_CLASS[feature.featureKey] ?? "bg-slate-100 text-slate-600"
        }`}
      >
        <span className="material-symbols-outlined text-[28px]">{feature.iconName}</span>
      </div>
      <span className="text-center text-[11px] font-semibold leading-4">
        {getFeatureDisplayName(feature)}
      </span>
    </article>
  );
}

function AdminMoreSortableOverlay({ feature }: { feature: ClubFeatureSummary }) {
  return (
    <article className="pointer-events-none relative flex flex-col items-center space-y-2 rounded-2xl border border-[#ec5b13]/35 bg-white px-3 py-3 shadow-[0_16px_36px_rgba(15,23,42,0.2)] ring-2 ring-[#ec5b13]/20">
      <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#ec5b13]/30 bg-white text-[#ec5b13] shadow-sm">
        <span className="font-mono text-[10px] font-bold tracking-[-0.2em]">::</span>
      </div>
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          FEATURE_ACCENT_CLASS[feature.featureKey] ?? "bg-slate-100 text-slate-600"
        }`}
      >
        <span className="material-symbols-outlined text-[28px]">{feature.iconName}</span>
      </div>
      <span className="text-center text-[11px] font-semibold leading-4">
        {getFeatureDisplayName(feature)}
      </span>
    </article>
  );
}

export function AdminBottomNav({ clubId }: AdminBottomNavProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const isDocked = useBottomNavScrollDocking({ routeKey: pathname });
  const [openMenuPathname, setOpenMenuPathname] = useState<string | null>(null);
  const [enabledFeatures, setEnabledFeatures] = useState<ClubFeatureSummary[]>([]);
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [orderedMenuItems, setOrderedMenuItems] = useState<ClubFeatureSummary[]>([]);
  const [activeFeatureKey, setActiveFeatureKey] = useState<string | null>(null);
  const [isReorderSaving, setIsReorderSaving] = useState(false);
  const [reorderFeedback, setReorderFeedback] = useState<string | null>(null);
  const [reorderAlertMessage, setReorderAlertMessage] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 10,
      },
    }),
  );
  const menuItems = enabledFeatures;
  const isMoreOpen = openMenuPathname === pathname;
  const isFeatureRouteActive = menuItems.some((feature) => pathname === feature.adminPath);

  useEffect(() => {
    let cancelled = false;

    const loadFeatures = async () => {
      const result = await getClubFeatures(clubId);
      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setEnabledFeatures([]);
        setOrderedMenuItems([]);
        return;
      }

      const nextEnabled = result.data.filter((feature) => feature.enabled);
      setEnabledFeatures(nextEnabled);
      setOrderedMenuItems(nextEnabled);
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

  useEffect(() => {
    if (!reorderAlertMessage) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setReorderAlertMessage(null);
    }, 2000);
    return () => window.clearTimeout(timeoutId);
  }, [reorderAlertMessage]);

  const persistFeatureOrder = async (nextOrderedFeatures: ClubFeatureSummary[]) => {
    setIsReorderSaving(true);
    setReorderFeedback(null);
    setReorderAlertMessage(null);
    const result = await updateClubFeatures(clubId, {
      enabledFeatureKeys: nextOrderedFeatures.map((feature) => feature.featureKey),
    });
    setIsReorderSaving(false);

    if (!result.ok || !result.data) {
      setReorderFeedback(result.message ?? "순서 저장에 실패했습니다.");
      return;
    }

    const nextEnabled = result.data.filter((feature) => feature.enabled);
    setEnabledFeatures(nextEnabled);
    setOrderedMenuItems(nextEnabled);
    setReorderFeedback(null);
    setReorderAlertMessage("순서를 저장했습니다.");
    window.dispatchEvent(new Event("semo:club-features-updated"));
  };

  const handleReorderDragStart = (event: DragStartEvent) => {
    if (!reorderEnabled) {
      return;
    }
    const nextActiveKey = String(event.active.id);
    setActiveFeatureKey(nextActiveKey);
  };

  const handleReorderDragEnd = (event: DragEndEvent) => {
    setActiveFeatureKey(null);
    if (!reorderEnabled) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = event.over?.id == null ? null : String(event.over.id);
    if (overId == null || activeId === overId) {
      return;
    }

    const fromIndex = orderedMenuItems.findIndex((feature) => feature.featureKey === activeId);
    const toIndex = orderedMenuItems.findIndex((feature) => feature.featureKey === overId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const reordered = arrayMove(orderedMenuItems, fromIndex, toIndex);
    setOrderedMenuItems(reordered);
  };

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
  const displayMenuItems = reorderEnabled ? orderedMenuItems : menuItems;
  const activeFeature =
    activeFeatureKey == null
      ? null
      : orderedMenuItems.find((feature) => feature.featureKey === activeFeatureKey) ?? null;
  const reorderDirty = useMemo(() => {
    if (!reorderEnabled) {
      return false;
    }
    if (orderedMenuItems.length !== enabledFeatures.length) {
      return true;
    }
    return orderedMenuItems.some(
      (feature, index) => feature.featureKey !== enabledFeatures[index]?.featureKey,
    );
  }, [enabledFeatures, orderedMenuItems, reorderEnabled]);

  const handleReorderReset = () => {
    setActiveFeatureKey(null);
    setOrderedMenuItems(enabledFeatures);
    setReorderFeedback(null);
    setReorderAlertMessage(null);
  };

  const closeMoreMenu = () => {
    setOpenMenuPathname(null);
    setReorderEnabled(false);
    setActiveFeatureKey(null);
    setReorderFeedback(null);
    setReorderAlertMessage(null);
    setOrderedMenuItems(enabledFeatures);
  };

  const toggleMoreMenu = () => {
    if (isMoreOpen) {
      closeMoreMenu();
      return;
    }

    setReorderEnabled(false);
    setActiveFeatureKey(null);
    setReorderFeedback(null);
    setReorderAlertMessage(null);
    setOrderedMenuItems(enabledFeatures);
    setOpenMenuPathname(pathname);
  };

  const renderButtons = () =>
    ADMIN_ITEMS.map((item) => {
      const href = item.href?.(clubId);
      const isMoreItem = item.key === "MORE";
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
              toggleMoreMenu()
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
              onClick={closeMoreMenu}
              {...overlayFadeMotion(reduceMotion)}
            />
            <motion.div
              className="pointer-events-none fixed inset-x-0 bottom-24 z-50 px-6"
              {...popInMotion(reduceMotion)}
            >
              <div className="pointer-events-auto mx-auto w-full max-w-sm">
                <div className="relative rounded-[32px] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                  <div className="absolute right-0 -top-10 z-10 flex items-center gap-2">
                    {reorderEnabled && reorderDirty ? (
                      <>
                        <button
                          type="button"
                          onClick={handleReorderReset}
                          disabled={isReorderSaving}
                          aria-label="순서 변경 리셋"
                          title="순서 변경 리셋"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-[17px]">restart_alt</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void persistFeatureOrder(orderedMenuItems)}
                          disabled={isReorderSaving}
                          className="inline-flex h-8 items-center justify-center rounded-full border border-[#ec5b13]/30 bg-[#ec5b13] px-3 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          저장
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setReorderEnabled((current) => !current);
                        setReorderFeedback(null);
                      }}
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                        reorderEnabled
                          ? "border-[#ec5b13]/30 bg-[#ec5b13]/10 text-[#ec5b13]"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                      aria-pressed={reorderEnabled}
                      aria-label="순서 변경 모드 전환"
                      title="순서 변경"
                    >
                      <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                    </button>
                  </div>

                  {displayMenuItems.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-5 text-center text-xs font-medium text-slate-500">
                      활성화된 기능이 없습니다.
                    </div>
                  ) : reorderEnabled ? (
                    <div className="space-y-2">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleReorderDragStart}
                        onDragEnd={handleReorderDragEnd}
                        onDragCancel={() => {
                          setActiveFeatureKey(null);
                        }}
                      >
                        <SortableContext
                          items={displayMenuItems.map((feature) => feature.featureKey)}
                          strategy={rectSortingStrategy}
                        >
                          <div className="grid grid-cols-3 gap-6">
                            {displayMenuItems.map((item) => (
                              <AdminMoreSortableItem
                                key={item.featureKey}
                                feature={item}
                              />
                            ))}
                          </div>
                        </SortableContext>
                        <DragOverlay dropAnimation={null}>
                          {activeFeature ? <AdminMoreSortableOverlay feature={activeFeature} /> : null}
                        </DragOverlay>
                      </DndContext>
                      {reorderFeedback ? (
                        <p className="text-center text-[11px] font-medium text-slate-500">
                          {reorderFeedback}
                        </p>
                      ) : null}
                      {isReorderSaving ? (
                        <p className="text-center text-[11px] font-medium text-[#ec5b13]">
                          순서 저장 중...
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-6">
                      {displayMenuItems.map((item, index) => (
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
                            onClick={closeMoreMenu}
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
                    </div>
                  )}
                  <div className="absolute -bottom-2 left-[70%] h-5 w-5 -translate-x-1/2 rotate-45 border-b border-r border-slate-100 bg-white" />
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {reorderAlertMessage ? (
        <div className="pointer-events-none fixed inset-x-0 top-5 z-[70] flex justify-center px-4">
          <div className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {reorderAlertMessage}
          </div>
        </div>
      ) : null}

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
