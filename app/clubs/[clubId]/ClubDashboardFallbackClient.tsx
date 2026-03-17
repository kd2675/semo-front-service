"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import {
  checkInClubAttendance,
  getClubAttendance,
  getClubDashboardWidgetEditor,
  getClubDashboardWidgets,
  getMyClub,
  updateClubDashboardWidgets,
  type ClubAttendanceResponse,
  type ClubDashboardEditorResponse,
  type ClubDashboardWidgetSummary,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import {
  ClubDashboardLoadingShell,
  ClubDashboardWidgetGridShell,
} from "./ClubRouteLoadingShells";

type ClubDashboardFallbackClientProps = {
  clubId: string;
};

const WIDGET_ACCENT_CLASS: Record<string, string> = {
  BOARD_NOTICE: "bg-blue-50 text-blue-600",
  SCHEDULE_OVERVIEW: "bg-amber-50 text-amber-600",
  PROFILE_SUMMARY: "bg-emerald-50 text-emerald-600",
  ATTENDANCE_STATUS: "bg-indigo-50 text-indigo-600",
};

function normalizeSortOrder(widgets: ClubDashboardWidgetSummary[]) {
  const enabledKeys = widgets
    .filter((widget) => widget.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey))
    .map((widget) => widget.widgetKey);
  const sortOrderByKey = new Map(enabledKeys.map((key, index) => [key, (index + 1) * 10]));
  return widgets.map((widget) =>
    widget.enabled
      ? { ...widget, sortOrder: sortOrderByKey.get(widget.widgetKey) ?? widget.sortOrder }
      : widget,
  );
}

function reorderEnabledWidgets(
  widgets: ClubDashboardWidgetSummary[],
  draggedWidgetKey: string,
  targetWidgetKey: string,
) {
  if (draggedWidgetKey === targetWidgetKey) {
    return widgets;
  }

  const enabledWidgets = widgets
    .filter((widget) => widget.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey));
  const sourceIndex = enabledWidgets.findIndex((widget) => widget.widgetKey === draggedWidgetKey);
  const targetIndex = enabledWidgets.findIndex((widget) => widget.widgetKey === targetWidgetKey);
  if (sourceIndex < 0 || targetIndex < 0) {
    return widgets;
  }

  const reordered = [...enabledWidgets];
  const [source] = reordered.splice(sourceIndex, 1);
  if (!source) {
    return widgets;
  }
  reordered.splice(targetIndex, 0, source);
  const sortOrderByKey = new Map(
    reordered.map((widget, index) => [widget.widgetKey, (index + 1) * 10]),
  );

  return widgets.map((widget) =>
    widget.enabled
      ? { ...widget, sortOrder: sortOrderByKey.get(widget.widgetKey) ?? widget.sortOrder }
      : widget,
  );
}

function DashboardWidgetCard({
  clubId,
  widget,
  editMode,
  isAdmin,
  isDragging,
  isDropTarget,
  isDisabled,
  reduceMotion,
  attendanceData,
  attendanceLoading,
  attendanceError,
  attendanceFeedback,
  attendancePulseToken,
  isCheckingInAttendance,
  onRemove,
  onAttendanceCheckIn,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onTouchDragStart,
}: {
  clubId: string;
  widget: ClubDashboardWidgetSummary;
  editMode: boolean;
  isAdmin: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  isDisabled: boolean;
  reduceMotion: boolean;
  attendanceData: ClubAttendanceResponse | null;
  attendanceLoading: boolean;
  attendanceError: string | null;
  attendanceFeedback: string | null;
  attendancePulseToken: number;
  isCheckingInAttendance: boolean;
  onRemove: (widgetKey: string) => void;
  onAttendanceCheckIn: () => void;
  onDragStart: (widgetKey: string) => void;
  onDragOver: (widgetKey: string) => void;
  onDrop: (widgetKey: string) => void;
  onDragEnd: () => void;
  onTouchDragStart: (widgetKey: string) => void;
}) {
  const spanClass = widget.columnSpan >= 2 ? "md:col-span-2" : "";
  const accentClass = WIDGET_ACCENT_CLASS[widget.widgetKey] ?? "bg-slate-100 text-slate-600";
  const isEditMode = isAdmin && editMode;
  const isAttendanceWidget = widget.widgetKey === "ATTENDANCE_STATUS";
  const currentSession = attendanceData?.currentSession;
  const recentSession = attendanceData?.recentSessions?.[0] ?? null;
  const statusLabel = currentSession
    ? currentSession.checkedIn
      ? "Checked In"
      : currentSession.canCheckIn
        ? "Open"
        : "Closed"
    : "Closed";
  const statusClassName = currentSession
    ? currentSession.checkedIn
      ? "bg-emerald-100 text-emerald-600"
      : currentSession.canCheckIn
        ? "bg-blue-100 text-blue-600"
        : "bg-slate-200 text-slate-500"
    : "bg-slate-200 text-slate-500";
  const shouldPulseAttendance = isAttendanceWidget && attendancePulseToken > 0 && !reduceMotion;
  const baseBoxShadow = "0 1px 2px rgba(15, 23, 42, 0.06)";

  return (
    <motion.article
      key={isAttendanceWidget ? `${widget.widgetKey}-${attendancePulseToken}` : widget.widgetKey}
      data-widget-key={widget.widgetKey}
      onDragOver={(event) => {
        if (!isEditMode) {
          return;
        }
        event.preventDefault();
        onDragOver(widget.widgetKey);
      }}
      onDrop={(event) => {
        if (!isEditMode) {
          return;
        }
        event.preventDefault();
        onDrop(widget.widgetKey);
      }}
      className={`relative flex min-h-[180px] flex-col rounded-xl border bg-white p-5 shadow-sm transition ${
        isDropTarget
          ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
          : "border-slate-200"
      } ${isDragging ? "opacity-60" : ""} ${spanClass}`}
      animate={
        shouldPulseAttendance
          ? {
              scale: [1, 1.01, 1],
              boxShadow: [
                baseBoxShadow,
                "0 0 0 2px rgba(19, 91, 236, 0.24), 0 14px 28px rgba(19, 91, 236, 0.16)",
                baseBoxShadow,
              ],
            }
          : {
              scale: 1,
              boxShadow: baseBoxShadow,
            }
      }
      transition={{
        duration: reduceMotion ? 0 : shouldPulseAttendance ? 0.78 : 0.2,
        ease: "easeOut",
      }}
    >
      {isEditMode ? (
        <div className="absolute left-3 top-3 z-10">
          <button
            type="button"
            draggable={!isDisabled}
            onDragStart={(event) => {
              if (isDisabled) {
                return;
              }
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", widget.widgetKey);
              onDragStart(widget.widgetKey);
            }}
            onDragEnd={onDragEnd}
            onTouchStart={() => {
              if (!isDisabled) {
                onTouchDragStart(widget.widgetKey);
              }
            }}
            className="flex size-8 touch-none items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 active:cursor-grabbing"
            aria-label="위젯 순서 이동"
          >
            <span className="material-symbols-outlined text-lg">drag_indicator</span>
          </button>
        </div>
      ) : null}
      {isEditMode ? (
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => onRemove(widget.widgetKey)}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:text-rose-500"
          aria-label="위젯 제거"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      ) : null}
      <div className={`mb-4 flex items-center gap-3 ${isEditMode ? "pr-12 pl-10" : "pr-12"}`}>
        <div className={`flex size-10 items-center justify-center rounded-lg ${accentClass}`}>
          <span className="material-symbols-outlined text-xl">{widget.iconName}</span>
        </div>
        <div>
          <h3 className="text-base font-bold">{widget.title}</h3>
          {!widget.available ? (
            <p className="text-xs font-semibold text-amber-600">Required feature is disabled</p>
          ) : null}
        </div>
      </div>
      {isAttendanceWidget ? (
        <div className="space-y-2">
          {attendanceLoading ? (
            <>
              <div className="h-4 w-32 rounded-full bg-slate-100" />
              <div className="h-4 w-full rounded-full bg-slate-100" />
              <div className="h-10 w-full rounded-xl bg-slate-50" />
            </>
          ) : attendanceError ? (
            <p className="text-sm text-slate-500">출석 정보를 가져오지 못했습니다.</p>
          ) : currentSession ? (
            <>
              <motion.p
                key={`attendance-title-${currentSession.sessionId}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
                className="text-sm font-semibold text-slate-900"
              >
                {currentSession.title}
              </motion.p>
              <p className="text-xs text-slate-500">{currentSession.attendanceDateLabel}</p>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <motion.p
                  key={`attendance-count-${currentSession.checkedInCount}-${currentSession.memberCount}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                  className="text-xs font-medium text-slate-500"
                >
                  {currentSession.checkedInCount}/{currentSession.memberCount} checked-in
                </motion.p>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={`attendance-status-${statusLabel}`}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 2 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: -2 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusClassName}`}
                  >
                    {statusLabel}
                  </motion.span>
                </AnimatePresence>
              </div>
              {currentSession.checkedInAtLabel ? (
                <p className="text-[11px] text-slate-400">체크인 시각: {currentSession.checkedInAtLabel}</p>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">현재 열린 출석 세션이 없습니다.</p>
              {recentSession ? (
                <p className="text-xs text-slate-400">
                  최근: {recentSession.title} · {recentSession.attendanceDateLabel}
                </p>
              ) : null}
            </>
          )}
          <AnimatePresence initial={false}>
            {attendanceFeedback ? (
              <motion.p
                key={`attendance-feedback-${attendanceFeedback}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                className="text-xs font-medium text-slate-500"
              >
                {attendanceFeedback}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-sm text-slate-500">{widget.description ?? "No widget description yet."}</p>
      )}
      <div className="mt-auto pt-5">
        {isEditMode ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
            Drag to reorder
          </span>
        ) : (
          <>
            {isAttendanceWidget && currentSession?.canCheckIn && !currentSession.checkedIn ? (
              <motion.button
                type="button"
                onClick={onAttendanceCheckIn}
                disabled={attendanceLoading || isCheckingInAttendance}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20 disabled:opacity-60"
              >
                {isCheckingInAttendance ? "출석 처리 중..." : "출석하기"}
                <motion.span
                  className="material-symbols-outlined text-sm"
                  animate={
                    isCheckingInAttendance && !reduceMotion
                      ? { rotate: 360 }
                      : { rotate: 0 }
                  }
                  transition={
                    isCheckingInAttendance && !reduceMotion
                      ? { repeat: Infinity, duration: 1, ease: "linear" }
                      : { duration: 0.2 }
                  }
                >
                  check_circle
                </motion.span>
              </motion.button>
            ) : (
              <RouterLink
                href={widget.userPath || `/clubs/${clubId}`}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
              >
                Open
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </RouterLink>
            )}
          </>
        )}
      </div>
    </motion.article>
  );
}

export function ClubDashboardFallbackClient({
  clubId,
}: ClubDashboardFallbackClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [widgets, setWidgets] = useState<ClubDashboardWidgetSummary[]>([]);
  const [editor, setEditor] = useState<ClubDashboardEditorResponse | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [draggingWidgetKey, setDraggingWidgetKey] = useState<string | null>(null);
  const [dragOverWidgetKey, setDragOverWidgetKey] = useState<string | null>(null);
  const [touchDraggingWidgetKey, setTouchDraggingWidgetKey] = useState<string | null>(null);
  const [touchDragOverWidgetKey, setTouchDragOverWidgetKey] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<ClubAttendanceResponse | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceFeedback, setAttendanceFeedback] = useState<string | null>(null);
  const [attendancePulseToken, setAttendancePulseToken] = useState(0);
  const [isCheckingInAttendance, setIsCheckingInAttendance] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setDashboardLoading(true);
      setError(null);
      setDashboardError(null);
      setFeedback(null);

      const clubResult = await getMyClub(clubId);
      if (cancelled) {
        return;
      }
      if (!clubResult.ok || !clubResult.data) {
        setClub(null);
        setError(clubResult.message ?? "클럽 정보를 불러오지 못했습니다.");
        setIsLoading(false);
        setDashboardLoading(false);
        return;
      }

      const clubData = clubResult.data;
      setClub(clubData);
      setIsLoading(false);

      if (clubData.admin) {
        const editorResult = await getClubDashboardWidgetEditor(clubId, "USER_HOME");
        if (cancelled) {
          return;
        }
        if (!editorResult.ok || !editorResult.data) {
          setEditor(null);
          setDashboardError(editorResult.message ?? "홈 위젯 편집 정보를 불러오지 못했습니다.");
          setDashboardLoading(false);
          return;
        }
        setEditor(editorResult.data);
        setDashboardLoading(false);
        return;
      }

      const widgetResult = await getClubDashboardWidgets(clubId, "USER_HOME");
      if (cancelled) {
        return;
      }
      if (!widgetResult.ok || !widgetResult.data) {
        setWidgets([]);
        setDashboardError(widgetResult.message ?? "홈 위젯을 불러오지 못했습니다.");
        setDashboardLoading(false);
        return;
      }
      setWidgets(widgetResult.data);
      setDashboardLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId]);

  const visibleWidgets = useMemo(() => {
    if (!club) {
      return [];
    }

    if (club.admin) {
      const source = editor?.widgets ?? [];
      return source
        .filter((widget) => widget.enabled && widget.available)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey));
    }

    return widgets
      .filter((widget) => widget.enabled && widget.available)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey));
  }, [club, editor?.widgets, widgets]);

  const addableWidgets = useMemo(() => {
    if (!club?.admin || !editor) {
      return [];
    }
    return editor.widgets
      .filter((widget) => !widget.enabled && widget.available)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey));
  }, [club?.admin, editor]);

  const hasAttendanceWidget = useMemo(() => {
    if (club?.admin) {
      return Boolean(
        editor?.widgets.some(
          (widget) =>
            widget.widgetKey === "ATTENDANCE_STATUS" && widget.enabled && widget.available,
        ),
      );
    }
    return widgets.some(
      (widget) =>
        widget.widgetKey === "ATTENDANCE_STATUS" && widget.enabled && widget.available,
    );
  }, [club?.admin, editor?.widgets, widgets]);

  const loadAttendanceData = useCallback(async () => {
    if (!hasAttendanceWidget) {
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError(null);
    const result = await getClubAttendance(clubId);
    if (!result.ok || !result.data) {
      setAttendanceData(null);
      setAttendanceError(result.message ?? "출석 정보를 불러오지 못했습니다.");
      setAttendanceLoading(false);
      return;
    }

    setAttendanceData(result.data);
    setAttendanceLoading(false);
  }, [clubId, hasAttendanceWidget]);

  const persistEditorWidgets = useCallback(
    async (nextWidgets: ClubDashboardWidgetSummary[], successMessage: string) => {
      if (!club?.admin) {
        return;
      }

      setIsSaving(true);
      setFeedback(null);
      const result = await updateClubDashboardWidgets(clubId, {
        scope: "USER_HOME",
        widgets: nextWidgets.map((widget) => ({
          widgetKey: widget.widgetKey,
          enabled: widget.enabled,
          sortOrder: widget.sortOrder,
          columnSpan: widget.columnSpan,
          rowSpan: widget.rowSpan,
        })),
      });
      setIsSaving(false);

      if (!result.ok || !result.data) {
        setFeedback(result.message ?? "위젯 저장에 실패했습니다.");
        return;
      }

      setEditor(result.data);
      setFeedback(successMessage);
      window.dispatchEvent(new Event("semo:dashboard-widgets-updated"));
    },
    [club?.admin, clubId],
  );

  const handleRemoveWidget = (widgetKey: string) => {
    if (!editor || isSaving) {
      return;
    }

    const nextWidgets = normalizeSortOrder(
      editor.widgets.map((widget) =>
        widget.widgetKey === widgetKey ? { ...widget, enabled: false } : widget,
      ),
    );
    startTransition(() => {
      void persistEditorWidgets(nextWidgets, "위젯이 홈에서 제거되었습니다.");
    });
  };

  const handleAddWidget = (widgetKey: string) => {
    if (!editor || isSaving) {
      return;
    }

    const nextWidgets = normalizeSortOrder(
      editor.widgets.map((widget) =>
        widget.widgetKey === widgetKey ? { ...widget, enabled: true } : widget,
      ),
    );
    startTransition(() => {
      void persistEditorWidgets(nextWidgets, "위젯이 홈에 추가되었습니다.");
    });
  };

  const reorderAndPersist = useCallback(
    (sourceWidgetKey: string, targetWidgetKey: string) => {
      if (!editor || isSaving || sourceWidgetKey === targetWidgetKey) {
        return;
      }

      const nextWidgets = reorderEnabledWidgets(editor.widgets, sourceWidgetKey, targetWidgetKey);
      startTransition(() => {
        void persistEditorWidgets(nextWidgets, "위젯 순서가 저장되었습니다.");
      });
    },
    [editor, isSaving, persistEditorWidgets],
  );

  const clearDragState = () => {
    setDraggingWidgetKey(null);
    setDragOverWidgetKey(null);
  };

  const handleDesktopDragStart = (widgetKey: string) => {
    if (!club?.admin || !editMode || isSaving) {
      return;
    }
    setDraggingWidgetKey(widgetKey);
    setDragOverWidgetKey(widgetKey);
  };

  const handleDesktopDragOver = (widgetKey: string) => {
    if (!draggingWidgetKey || draggingWidgetKey === widgetKey) {
      return;
    }
    setDragOverWidgetKey(widgetKey);
  };

  const handleDesktopDrop = (widgetKey: string) => {
    if (!draggingWidgetKey) {
      return;
    }
    reorderAndPersist(draggingWidgetKey, widgetKey);
    clearDragState();
  };

  useEffect(() => {
    if (!touchDraggingWidgetKey) {
      return;
    }

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const targetElement = document
        .elementFromPoint(touch.clientX, touch.clientY)
        ?.closest<HTMLElement>("[data-widget-key]");
      const widgetKey = targetElement?.dataset.widgetKey ?? null;
      if (!widgetKey || widgetKey === touchDragOverWidgetKey) {
        return;
      }
      setTouchDragOverWidgetKey(widgetKey);
    };

    const handleTouchEnd = () => {
      const targetWidgetKey = touchDragOverWidgetKey ?? touchDraggingWidgetKey;
      reorderAndPersist(touchDraggingWidgetKey, targetWidgetKey);
      setTouchDraggingWidgetKey(null);
      setTouchDragOverWidgetKey(null);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [touchDraggingWidgetKey, touchDragOverWidgetKey, reorderAndPersist]);

  useEffect(() => {
    if (!hasAttendanceWidget) {
      return;
    }
    const timerId = window.setTimeout(() => {
      void loadAttendanceData();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasAttendanceWidget, loadAttendanceData]);

  const handleAttendanceCheckIn = useCallback(async () => {
    const currentSession = attendanceData?.currentSession;
    if (!currentSession || !currentSession.canCheckIn || isCheckingInAttendance) {
      return;
    }

    setIsCheckingInAttendance(true);
    setAttendanceFeedback(null);
    const result = await checkInClubAttendance(clubId, {
      sessionId: currentSession.sessionId,
    });
    setIsCheckingInAttendance(false);

    if (!result.ok || !result.data) {
      setAttendanceFeedback(result.message ?? "출석 처리에 실패했습니다.");
      return;
    }

    setAttendanceFeedback("출석이 완료되었습니다.");
    setAttendancePulseToken((current) => current + 1);
    await loadAttendanceData();
  }, [attendanceData?.currentSession, clubId, isCheckingInAttendance, loadAttendanceData]);

  if (isLoading && !club && !error) {
    return <ClubDashboardLoadingShell />;
  }

  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <RouterLink
                href="/"
                className="flex size-10 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]"
              >
                <span className="material-symbols-outlined">menu</span>
              </RouterLink>
              <h1 className="text-xl font-bold tracking-tight">
                {club?.name ?? "Club Home"}
              </h1>
            </div>
            {club?.admin ? (
              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  clearDragState();
                  setTouchDraggingWidgetKey(null);
                  setTouchDragOverWidgetKey(null);
                  setEditMode((current) => !current);
                }}
                className="flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
              >
                <span className="material-symbols-outlined text-sm">dashboard_customize</span>
                {editMode ? "Done" : "Edit"}
              </button>
            ) : (
              <div className="size-10" />
            )}
          </div>
        </header>

        <main className="flex-1 space-y-6 p-4 pb-28 md:p-6 md:pb-32">
          <motion.section {...staggeredFadeUpMotion(0, reduceMotion)}>
            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-slate-200 shadow-sm">
              {club?.imageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${club.imageUrl}')` }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-blue-100" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-end gap-4">
                <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-white text-2xl font-bold text-[var(--primary)] shadow-lg">
                  {(club?.name ?? "SEMO").slice(0, 2).toUpperCase()}
                </div>
                {club?.admin ? (
                  <div className="pb-1">
                    <span className="inline-flex items-center rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-xs font-semibold text-white">
                      Admin View
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            {isLoading ? (
              <>
                <div className="h-6 w-36 rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-100" />
              </>
            ) : error ? (
              <>
                <h2 className="text-lg font-bold">클럽 정보를 열지 못했습니다.</h2>
                <p className="mt-2 text-sm text-slate-500">{error}</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{club?.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {club?.summary ?? club?.description ?? "클럽 소개가 아직 없습니다."}
                    </p>
                  </div>
                  {editMode && club?.admin ? (
                    <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                      Widget Edit Mode
                    </span>
                  ) : null}
                </div>
                {feedback ? (
                  <p className="mt-3 text-xs font-medium text-slate-500">{feedback}</p>
                ) : null}
              </>
            )}
          </motion.section>

          <motion.section {...staggeredFadeUpMotion(2, reduceMotion)}>
            {dashboardLoading ? (
              <ClubDashboardWidgetGridShell />
            ) : dashboardError ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                {dashboardError}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {visibleWidgets.map((widget) => (
                  <DashboardWidgetCard
                    key={widget.widgetKey}
                    clubId={clubId}
                    widget={widget}
                    editMode={editMode}
                    isAdmin={Boolean(club?.admin)}
                    isDragging={draggingWidgetKey === widget.widgetKey || touchDraggingWidgetKey === widget.widgetKey}
                    isDropTarget={dragOverWidgetKey === widget.widgetKey || touchDragOverWidgetKey === widget.widgetKey}
                    isDisabled={isSaving}
                    reduceMotion={reduceMotion}
                    attendanceData={widget.widgetKey === "ATTENDANCE_STATUS" ? attendanceData : null}
                    attendanceLoading={widget.widgetKey === "ATTENDANCE_STATUS" && attendanceLoading}
                    attendanceError={widget.widgetKey === "ATTENDANCE_STATUS" ? attendanceError : null}
                    attendanceFeedback={widget.widgetKey === "ATTENDANCE_STATUS" ? attendanceFeedback : null}
                    attendancePulseToken={widget.widgetKey === "ATTENDANCE_STATUS" ? attendancePulseToken : 0}
                    isCheckingInAttendance={widget.widgetKey === "ATTENDANCE_STATUS" && isCheckingInAttendance}
                    onRemove={handleRemoveWidget}
                    onAttendanceCheckIn={handleAttendanceCheckIn}
                    onDragStart={handleDesktopDragStart}
                    onDragOver={handleDesktopDragOver}
                    onDrop={handleDesktopDrop}
                    onDragEnd={clearDragState}
                    onTouchDragStart={(widgetKey) => {
                      if (!club?.admin || !editMode || isSaving) {
                        return;
                      }
                      setTouchDraggingWidgetKey(widgetKey);
                      setTouchDragOverWidgetKey(widgetKey);
                    }}
                  />
                ))}
                {club?.admin && editMode ? (
                  <article className="flex min-h-[180px] flex-col rounded-xl border-2 border-dashed border-slate-300 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-slate-500">
                      <span className="material-symbols-outlined">add_circle</span>
                      <h3 className="text-base font-bold">Add Widget</h3>
                    </div>
                    <p className="text-sm text-slate-500">
                      `/more`에서 활성화된 기능 위젯만 홈에 추가할 수 있습니다.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {addableWidgets.map((widget) => (
                        <button
                          key={widget.widgetKey}
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleAddWidget(widget.widgetKey)}
                          className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20 disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                          {widget.displayName}
                        </button>
                      ))}
                      {addableWidgets.length === 0 ? (
                        <p className="text-xs font-medium text-slate-400">
                          추가 가능한 위젯이 없습니다.
                        </p>
                      ) : null}
                    </div>
                  </article>
                ) : null}
                {!dashboardLoading && !dashboardError && visibleWidgets.length === 0 && !editMode ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                    표시할 홈 위젯이 없습니다.
                  </div>
                ) : null}
              </div>
            )}
          </motion.section>

          {touchDraggingWidgetKey ? (
            <div className="fixed inset-x-4 bottom-28 z-40 rounded-full bg-slate-900/90 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg">
              드래그해서 원하는 위치에 놓으세요.
            </div>
          ) : null}
        </main>

        {club?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
      </div>
    </div>
  );
}
