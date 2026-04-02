"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RouterLink } from "@/app/components/RouterLink";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import {
  checkInClubAttendance,
  getClubAttendance,
  getClubDues,
  getClubBoard,
  getClubBracketHome,
  getClubDashboardWidgetEditor,
  getClubDashboardWidgets,
  getClubMemberDirectory,
  getMyClub,
  getClubPollHome,
  getClubSchedule,
  getClubTournamentHome,
  updateClubDashboardWidgets,
  type ClubAttendanceResponse,
  type ClubBoardResponse,
  type ClubBracketHomeResponse,
  type ClubDuesHomeResponse,
  type ClubMemberDirectoryResponse,
  type ClubPollHomeResponse,
  type ClubPollSummary,
  type ClubTournamentHomeResponse,
  type ClubDashboardEditorResponse,
  type ClubDashboardWidgetSummary,
  type ClubScheduleResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { getTournamentFeeLabel, getTournamentFormatLabel, getTournamentStatusLabel } from "@/app/lib/tournament";
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
  POLL_STATUS: "bg-amber-50 text-amber-500",
  PROFILE_SUMMARY: "bg-emerald-50 text-emerald-600",
  ATTENDANCE_STATUS: "bg-indigo-50 text-indigo-600",
  DUES_STATUS: "bg-emerald-50 text-emerald-700",
  MEMBER_DIRECTORY_HIGHLIGHT: "bg-rose-50 text-rose-600",
  TOURNAMENT_RECORD_LATEST: "bg-emerald-50 text-emerald-700",
  BRACKET_LATEST: "bg-amber-50 text-amber-700",
};

function getDuesStatusClassName(paymentStatus: string) {
  if (paymentStatus === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (paymentStatus === "WAIVED") {
    return "bg-slate-200 text-slate-600";
  }
  if (paymentStatus === "OVERDUE") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-amber-50 text-amber-700";
}

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

function cloneWidgets(widgets: ClubDashboardWidgetSummary[]) {
  return widgets.map((widget) => ({ ...widget }));
}

function extractEnabledWidgetKeys(widgets: ClubDashboardWidgetSummary[]) {
  return widgets
    .filter((widget) => widget.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey))
    .map((widget) => widget.widgetKey);
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

function getWidgetFeatureLabel(widget: ClubDashboardWidgetSummary) {
  if (!widget.requiredFeatureKey) {
    return "기본 위젯";
  }
  return `${widget.requiredFeatureKey} 기능 필요`;
}

function EnabledDashboardWidgetCard({
  widget,
  onRemove,
}: {
  widget: ClubDashboardWidgetSummary;
  onRemove: (widgetKey: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.widgetKey });

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative flex min-h-[96px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm ${
        isDragging ? "z-20 opacity-0" : ""
      }`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        className="flex size-9 touch-none shrink-0 cursor-grab items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:cursor-grabbing"
        aria-label={`${widget.displayName} 순서 변경`}
        title="드래그해서 순서를 바꿀 수 있습니다."
      >
        <span className="material-symbols-outlined text-lg">drag_indicator</span>
      </button>
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${WIDGET_ACCENT_CLASS[widget.widgetKey] ?? "bg-slate-100 text-slate-600"}`}>
        <span className="material-symbols-outlined text-[22px]">{widget.iconName}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-base font-bold text-slate-900">{widget.displayName}</p>
          <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
            Live
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {widget.description ?? "홈에서 빠르게 확인할 수 있는 위젯입니다."}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {getWidgetFeatureLabel(widget)}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
            {widget.userPath}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(widget.widgetKey)}
        className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/20"
      >
        숨김
      </button>
    </article>
  );
}

function EnabledDashboardWidgetOverlayCard({ widget }: { widget: ClubDashboardWidgetSummary }) {
  return (
    <article className="pointer-events-none w-[min(calc(100vw-2rem),72rem)] rounded-2xl border border-[var(--primary)]/30 bg-white px-4 py-4 shadow-[0_20px_44px_rgba(15,23,42,0.18)] ring-2 ring-[var(--primary)]/15">
      <div className="flex min-h-[96px] items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <span className="material-symbols-outlined text-lg">drag_indicator</span>
        </div>
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${WIDGET_ACCENT_CLASS[widget.widgetKey] ?? "bg-slate-100 text-slate-600"}`}>
          <span className="material-symbols-outlined text-[22px]">{widget.iconName}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-slate-900">{widget.displayName}</p>
          <p className="mt-1 text-sm text-slate-500">
            {widget.description ?? "홈에서 빠르게 확인할 수 있는 위젯입니다."}
          </p>
        </div>
        <div className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-xs font-bold text-[var(--primary)]">
          순서 이동
        </div>
      </div>
    </article>
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
  memberDirectoryData,
  memberDirectoryLoading,
  memberDirectoryError,
  duesData,
  duesLoading,
  duesError,
  boardData,
  boardLoading,
  boardError,
  scheduleData,
  scheduleLoading,
  scheduleError,
  pollData,
  pollLoading,
  pollError,
  tournamentData,
  tournamentLoading,
  tournamentError,
  bracketData,
  bracketLoading,
  bracketError,
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
  memberDirectoryData: ClubMemberDirectoryResponse | null;
  memberDirectoryLoading: boolean;
  memberDirectoryError: string | null;
  duesData: ClubDuesHomeResponse | null;
  duesLoading: boolean;
  duesError: string | null;
  boardData: ClubBoardResponse | null;
  boardLoading: boolean;
  boardError: string | null;
  scheduleData: ClubScheduleResponse | null;
  scheduleLoading: boolean;
  scheduleError: string | null;
  pollData: ClubPollHomeResponse | null;
  pollLoading: boolean;
  pollError: string | null;
  tournamentData: ClubTournamentHomeResponse | null;
  tournamentLoading: boolean;
  tournamentError: string | null;
  bracketData: ClubBracketHomeResponse | null;
  bracketLoading: boolean;
  bracketError: string | null;
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
  const isMemberDirectoryWidget = widget.widgetKey === "MEMBER_DIRECTORY_HIGHLIGHT";
  const isDuesWidget = widget.widgetKey === "DUES_STATUS";
  const isBoardNoticeWidget = widget.widgetKey === "BOARD_NOTICE";
  const isScheduleWidget = widget.widgetKey === "SCHEDULE_OVERVIEW";
  const isPollWidget = widget.widgetKey === "POLL_STATUS";
  const isTournamentWidget = widget.widgetKey === "TOURNAMENT_RECORD_LATEST";
  const isBracketWidget = widget.widgetKey === "BRACKET_LATEST";
  const todayAttendance = attendanceData?.todayAttendance;
  const recentLog = attendanceData?.recentLogs?.[0] ?? null;
  const featuredMembers = memberDirectoryData?.members.slice(0, 3) ?? [];
  const nextDueCharge = duesData?.nextPayableCharge ?? null;
  const latestNotice = boardData?.notices?.[0] ?? null;
  const latestOngoingPoll = useMemo<ClubPollSummary | null>(() => {
    if (!pollData) {
      return null;
    }

    return [...pollData.polls]
      .filter((poll) => poll.voteStatus === "ONGOING")
      .sort((left, right) => {
        const leftValue = `${left.voteStartDate}T${left.voteTimeLabel ?? "00:00"}`;
        const rightValue = `${right.voteStartDate}T${right.voteTimeLabel ?? "00:00"}`;
        return rightValue.localeCompare(leftValue);
      })[0] ?? null;
  }, [pollData]);
  const todayScheduleItems = useMemo(() => {
    if (!scheduleData) {
      return [];
    }

    const today = new Date();
    const todayLabel = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    return scheduleData.items
      .filter((item) => {
        if (item.contentType === "SCHEDULE_EVENT" && item.event) {
          return item.event.startDate === todayLabel;
        }
        if (item.contentType === "SCHEDULE_VOTE" && item.vote) {
          return item.vote.voteStartDate === todayLabel;
        }
        if (item.contentType === "NOTICE" && item.notice?.scheduleAt) {
          return item.notice.scheduleAt.slice(0, 10) === todayLabel;
        }
        return false;
      })
      .slice(0, 3);
  }, [scheduleData]);
  const featuredTournament = tournamentData?.featuredTournament ?? null;
  const closestMyTournament = tournamentData?.myTournaments?.[0] ?? null;
  const tournamentHero =
    closestMyTournament ?? featuredTournament ?? tournamentData?.tournaments?.[0] ?? null;
  const latestMyBracket = bracketData?.myBrackets?.[0] ?? null;
  const featuredBracket = bracketData?.featuredBracket ?? bracketData?.publishedBrackets?.[0] ?? null;
  const bracketHero = latestMyBracket ?? featuredBracket;
  const bracketHeroLabel = latestMyBracket?.mine ? "My Latest Bracket" : "Featured Bracket";
  const statusLabel = todayAttendance
    ? todayAttendance.checkedIn
      ? "Checked In"
      : "Pending"
    : "Unavailable";
  const statusClassName = todayAttendance
    ? todayAttendance.checkedIn
      ? "bg-emerald-100 text-emerald-600"
      : "bg-blue-100 text-blue-600"
    : "bg-slate-200 text-slate-500";
  const shouldPulseAttendance = isAttendanceWidget && attendancePulseToken > 0 && !reduceMotion;
  const baseBoxShadow = "0 1px 2px rgba(15, 23, 42, 0.06)";

  return (
    <motion.article
      key={
        isAttendanceWidget
          ? `${widget.widgetKey}-${attendancePulseToken}`
          : widget.widgetKey
      }
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
          ) : todayAttendance ? (
            <>
              <motion.p
                key={`attendance-title-${todayAttendance.attendanceDateLabel}`}
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
                className="text-sm font-semibold text-slate-900"
              >
                {todayAttendance.checkedIn ? "오늘 출석 완료" : "오늘 출석 필요"}
              </motion.p>
              <p className="text-xs text-slate-500">{todayAttendance.attendanceDateLabel}</p>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <motion.p
                  key={`attendance-count-${todayAttendance.checkedInCount}-${todayAttendance.memberCount}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
                  className="text-xs font-medium text-slate-500"
                >
                  {todayAttendance.checkedInCount}/{todayAttendance.memberCount} checked-in
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
              {todayAttendance.checkedInAtLabel ? (
                <p className="text-[11px] text-slate-400">체크인 시각: {todayAttendance.checkedInAtLabel}</p>
              ) : null}
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500">오늘 출석 정보를 아직 불러오지 못했습니다.</p>
              {recentLog ? (
                <p className="text-xs text-slate-400">
                  최근: {recentLog.attendanceDateLabel} · {recentLog.checkedInCount}/{recentLog.memberCount}명 출석
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : isMemberDirectoryWidget ? (
        <div className="space-y-3">
          {memberDirectoryLoading ? (
            <>
              <div className="h-4 w-28 rounded-full bg-slate-100" />
              <div className="h-20 w-full rounded-xl bg-slate-50" />
            </>
          ) : memberDirectoryError ? (
            <p className="text-sm text-slate-500">회원 디렉터리 정보를 가져오지 못했습니다.</p>
          ) : memberDirectoryData ? (
            <RouterLink
              href={`/clubs/${clubId}/more/members`}
              className="block rounded-xl border border-rose-100 bg-white p-4 shadow-sm transition-all hover:border-rose-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-600">
                    Member Directory
                  </p>
                  <p className="mt-2 text-base font-bold text-slate-900">
                    활동 멤버 {memberDirectoryData.totalMemberCount}명
                  </p>
                </div>
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                  More
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {featuredMembers.length > 0 ? (
                  featuredMembers.map((member) => (
                    <div
                      key={member.clubProfileId}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{member.displayName}</p>
                          <p className="truncate text-xs text-slate-500">
                          {memberDirectoryData.settings.showRecentActivity
                            ? member.recentActivity?.createdAtLabel
                            : memberDirectoryData.settings.showTagline
                              ? member.tagline
                              : null}
                          {!(memberDirectoryData.settings.showRecentActivity
                            ? member.recentActivity?.createdAtLabel
                            : memberDirectoryData.settings.showTagline
                              ? member.tagline
                              : null)
                            ? "회원 디렉터리 바로가기"
                            : ""}
                        </p>
                      </div>
                      {memberDirectoryData.settings.showPositions && member.positions[0] ? (
                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{
                            backgroundColor: member.positions[0].colorHex
                              ? `${member.positions[0].colorHex}1A`
                              : "#ffe4e6",
                            color: member.positions[0].colorHex ?? "#be123c",
                          }}
                        >
                          {member.positions[0].displayName}
                        </span>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">표시할 회원이 없습니다.</p>
                )}
              </div>
            </RouterLink>
          ) : (
            <p className="text-sm text-slate-500">회원 디렉터리 위젯 데이터를 준비 중입니다.</p>
          )}
        </div>
      ) : isDuesWidget ? (
        <div className="space-y-3">
          {duesLoading ? (
            <>
              <div className="h-4 w-24 rounded-full bg-slate-100" />
              <div className="h-20 w-full rounded-xl bg-slate-50" />
            </>
          ) : duesError ? (
            <p className="text-sm text-slate-500">회비 정보를 가져오지 못했습니다.</p>
          ) : nextDueCharge ? (
            <RouterLink
              href={`/clubs/${clubId}/more/dues`}
              className="block rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                    My Dues
                  </p>
                  <p className="mt-2 line-clamp-2 text-base font-bold text-slate-900">
                    {nextDueCharge.title}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${getDuesStatusClassName(nextDueCharge.invoice.paymentStatus)}`}>
                  {nextDueCharge.invoice.paymentStatusLabel}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">{nextDueCharge.dueAtLabel ?? "회비 항목"}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{nextDueCharge.amountLabel}</p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50/60 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">
                  미납 {duesData?.pendingInvoiceCount ?? 0}건 · 연체 {duesData?.overdueInvoiceCount ?? 0}건
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {duesData?.totalPendingAmountLabel ?? nextDueCharge.amountLabel}
                </span>
              </div>
            </RouterLink>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">현재 확인할 회비가 없습니다.</p>
              <p className="text-xs text-slate-500">새 회비가 발행되면 이 위젯에서 바로 확인할 수 있습니다.</p>
            </>
          )}
        </div>
      ) : isBoardNoticeWidget ? (
        <div className="space-y-2">
          {boardLoading ? (
            <>
              <div className="h-4 w-28 rounded-full bg-slate-100" />
              <div className="h-5 w-full rounded-full bg-slate-100" />
              <div className="h-4 w-full rounded-full bg-slate-50" />
              <div className="h-4 w-2/3 rounded-full bg-slate-50" />
            </>
          ) : boardError ? (
            <p className="text-sm text-slate-500">최근 공지를 가져오지 못했습니다.</p>
          ) : latestNotice ? (
            <>
              {latestNotice.thumbnailUrl || latestNotice.imageUrl ? (
                <div className="overflow-hidden rounded-xl bg-slate-100">
                  <div
                    className="h-28 w-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${latestNotice.thumbnailUrl ?? latestNotice.imageUrl}')`,
                    }}
                  />
                </div>
              ) : null}
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                Latest Notice
              </p>
              <p className="line-clamp-2 text-base font-bold text-slate-900">{latestNotice.title}</p>
              <p className="line-clamp-2 text-sm text-slate-500">{latestNotice.summary}</p>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">{latestNotice.author}</p>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-600">
                  {latestNotice.timeAgo}
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">아직 등록된 공지가 없습니다.</p>
              <p className="text-xs text-slate-500">가장 최근 공지가 생기면 이 위젯에 바로 표시됩니다.</p>
            </>
          )}
        </div>
      ) : isScheduleWidget ? (
        <div className="space-y-3">
          {scheduleLoading ? (
            <>
              <div className="h-4 w-24 rounded-full bg-slate-100" />
              <div className="h-16 w-full rounded-xl bg-slate-50" />
              <div className="h-16 w-full rounded-xl bg-slate-50" />
            </>
          ) : scheduleError ? (
            <p className="text-sm text-slate-500">오늘 일정을 가져오지 못했습니다.</p>
          ) : todayScheduleItems.length > 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                Today Schedule
              </p>
              <div className="space-y-2">
                {todayScheduleItems.map((item) => {
                  if (item.contentType === "SCHEDULE_EVENT" && item.event) {
                    return (
                      <RouterLink
                        key={`schedule-widget-event-${item.calendarItemId}`}
                        href={`/clubs/${clubId}/schedule/${item.event.eventId}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-[var(--primary)]/40"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                          <span className="material-symbols-outlined">edit_calendar</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">{item.event.title}</p>
                          <p className="truncate text-xs text-slate-500">
                            {item.event.locationLabel ?? item.event.dateLabel}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold text-slate-900">{item.event.timeLabel ?? "종일"}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">EVENT</p>
                        </div>
                      </RouterLink>
                    );
                  }

                  if (item.contentType === "SCHEDULE_VOTE" && item.vote) {
                    return (
                      <RouterLink
                        key={`schedule-widget-vote-${item.calendarItemId}`}
                        href={`/clubs/${clubId}/schedule/votes/${item.vote.voteId}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-amber-500/40"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                          <span className="material-symbols-outlined">poll</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">{item.vote.title}</p>
                          <p className="truncate text-xs text-slate-500">
                            {item.vote.votePeriodLabel}
                            {item.vote.voteTimeLabel ? ` · ${item.vote.voteTimeLabel}` : ""}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold text-slate-900">{item.vote.totalResponses}명</p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">VOTE</p>
                        </div>
                      </RouterLink>
                    );
                  }

                  if (item.contentType === "NOTICE" && item.notice) {
                    return (
                      <RouterLink
                        key={`schedule-widget-notice-${item.calendarItemId}`}
                        href={`/clubs/${clubId}/board/${item.notice.noticeId}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-sky-500/40"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600">
                          <span className="material-symbols-outlined">campaign</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">{item.notice.title}</p>
                          <p className="truncate text-xs text-slate-500">
                            {item.notice.locationLabel ?? item.notice.scheduleAtLabel ?? item.notice.timeAgo}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-bold text-slate-900">
                            {item.notice.scheduleAtLabel ?? "공지"}
                          </p>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">NOTICE</p>
                        </div>
                      </RouterLink>
                    );
                  }

                  return null;
                })}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">오늘 일정이 없습니다.</p>
              <p className="text-xs text-slate-500">오늘 날짜에 연결된 일정, 투표, 공지가 최대 3개까지 표시됩니다.</p>
            </>
          )}
        </div>
      ) : isPollWidget ? (
        <div className="space-y-3">
          {pollLoading ? (
            <>
              <div className="h-4 w-24 rounded-full bg-slate-100" />
              <div className="h-20 w-full rounded-xl bg-slate-50" />
            </>
          ) : pollError ? (
            <p className="text-sm text-slate-500">진행 중인 투표를 가져오지 못했습니다.</p>
          ) : latestOngoingPoll ? (
            <RouterLink
              href={`/clubs/${clubId}/more/polls/${latestOngoingPoll.voteId}`}
              className="block rounded-xl border border-amber-100 bg-white p-4 shadow-sm transition-all hover:border-amber-300"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                Ongoing Poll
              </p>
              <p className="mt-2 line-clamp-2 text-base font-bold text-slate-900">
                {latestOngoingPoll.title}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {latestOngoingPoll.votePeriodLabel}
                {latestOngoingPoll.voteTimeLabel ? ` · ${latestOngoingPoll.voteTimeLabel}` : ""}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">
                  {latestOngoingPoll.totalResponses}명 참여 · 선택지 {latestOngoingPoll.optionCount}개
                </p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-600">
                  진행 중
                </span>
              </div>
            </RouterLink>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">현재 진행 중인 투표가 없습니다.</p>
              <p className="text-xs text-slate-500">진행 상태의 가장 최근 투표 1건이 이 위젯에 표시됩니다.</p>
            </>
          )}
        </div>
      ) : isTournamentWidget ? (
        <div className="space-y-3">
          {tournamentLoading ? (
            <>
              <div className="h-4 w-28 rounded-full bg-slate-100" />
              <div className="h-24 w-full rounded-xl bg-slate-50" />
            </>
          ) : tournamentError ? (
            <p className="text-sm text-slate-500">대회 정보를 가져오지 못했습니다.</p>
          ) : tournamentHero ? (
            <RouterLink
              href={`/clubs/${clubId}/more/tournaments/${tournamentHero.tournamentRecordId}`}
              className="block rounded-xl border border-emerald-100 bg-white p-4 shadow-sm transition-all hover:border-emerald-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                    {closestMyTournament ? "My Tournament" : "Featured Tournament"}
                  </p>
                  <p className="mt-2 line-clamp-2 text-base font-bold text-slate-900">
                    {tournamentHero.title}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {getTournamentStatusLabel(tournamentHero.tournamentStatus)}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {tournamentHero.tournamentPeriodLabel}
                {tournamentHero.locationLabel ? ` · ${tournamentHero.locationLabel}` : ""}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50/60 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">
                  {getTournamentFormatLabel(tournamentHero.matchFormat)} · {tournamentHero.approvedApplicationCount}명 승인
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  {getTournamentFeeLabel(tournamentHero)}
                </span>
              </div>
            </RouterLink>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">표시할 대회가 없습니다.</p>
              <p className="text-xs text-slate-500">
                대표 대회나 내가 참여 중인 대회가 생기면 이 위젯에 표시됩니다.
              </p>
            </>
          )}
        </div>
      ) : isBracketWidget ? (
        <div className="space-y-3">
          {bracketLoading ? (
            <>
              <div className="h-4 w-28 rounded-full bg-slate-100" />
              <div className="h-24 w-full rounded-xl bg-slate-50" />
            </>
          ) : bracketError ? (
            <p className="text-sm text-slate-500">대진표 정보를 가져오지 못했습니다.</p>
          ) : bracketHero ? (
            <RouterLink
              href={widget.userPath || `/clubs/${clubId}/more/brackets`}
              className="block rounded-xl border border-amber-100 bg-white p-4 shadow-sm transition-all hover:border-amber-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                    {bracketHeroLabel}
                  </p>
                  <p className="mt-2 line-clamp-2 text-base font-bold text-slate-900">
                    {bracketHero.title}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  bracketHero.approvalStatus === "APPROVED"
                    ? "bg-emerald-50 text-emerald-700"
                    : bracketHero.approvalStatus === "PENDING"
                      ? "bg-amber-50 text-amber-700"
                      : bracketHero.approvalStatus === "REJECTED"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-slate-100 text-slate-600"
                }`}>
                  {bracketHero.approvalStatus === "APPROVED"
                    ? "승인 완료"
                    : bracketHero.approvalStatus === "PENDING"
                      ? "승인 대기"
                      : bracketHero.approvalStatus === "REJECTED"
                        ? "반려"
                        : "초안"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {bracketHero.summaryText ?? `${bracketHero.participantCount}명 참가 · ${
                  bracketHero.sourceType === "TOURNAMENT" ? "대회 불러오기" : "직접 작성"
                }`}
              </p>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-2">
                <p className="text-xs font-medium text-slate-500">
                  {bracketHero.participantCount}명 참가
                  {bracketHero.authorDisplayName ? ` · ${bracketHero.authorDisplayName}` : ""}
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-amber-700">
                  {bracketHero.sourceType === "TOURNAMENT" ? "대회 연동" : "직접 작성"}
                </span>
              </div>
              {latestMyBracket && featuredBracket && latestMyBracket.bracketRecordId !== featuredBracket.bracketRecordId ? (
                <p className="mt-3 text-[11px] font-medium text-slate-400">
                  공개 대진표: {featuredBracket.title}
                </p>
              ) : null}
            </RouterLink>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-900">표시할 대진표가 없습니다.</p>
              <p className="text-xs text-slate-500">
                승인된 대진표나 내 최신 작업이 생기면 이 위젯에 표시됩니다.
              </p>
            </>
          )}
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
            {isAttendanceWidget && todayAttendance?.canCheckIn && !todayAttendance.checkedIn ? (
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
  const [, setEditor] = useState<ClubDashboardEditorResponse | null>(null);
  const [editorWidgets, setEditorWidgets] = useState<ClubDashboardWidgetSummary[]>([]);
  const [savedEditorWidgets, setSavedEditorWidgets] = useState<ClubDashboardWidgetSummary[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeEditorWidgetKey, setActiveEditorWidgetKey] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<ClubAttendanceResponse | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [memberDirectoryData, setMemberDirectoryData] = useState<ClubMemberDirectoryResponse | null>(null);
  const [memberDirectoryLoading, setMemberDirectoryLoading] = useState(false);
  const [memberDirectoryError, setMemberDirectoryError] = useState<string | null>(null);
  const [duesData, setDuesData] = useState<ClubDuesHomeResponse | null>(null);
  const [duesLoading, setDuesLoading] = useState(false);
  const [duesError, setDuesError] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<ClubBoardResponse | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<ClubScheduleResponse | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [pollData, setPollData] = useState<ClubPollHomeResponse | null>(null);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [tournamentData, setTournamentData] = useState<ClubTournamentHomeResponse | null>(null);
  const [tournamentLoading, setTournamentLoading] = useState(false);
  const [tournamentError, setTournamentError] = useState<string | null>(null);
  const [bracketData, setBracketData] = useState<ClubBracketHomeResponse | null>(null);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);
  const [attendancePulseToken, setAttendancePulseToken] = useState(0);
  const [isCheckingInAttendance, setIsCheckingInAttendance] = useState(false);
  const { toast, showToast, clearToast } = useEphemeralToast();
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
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setDashboardLoading(true);
      setError(null);
      setDashboardError(null);
      clearToast();

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
        setEditorWidgets(cloneWidgets(editorResult.data.widgets));
        setSavedEditorWidgets(cloneWidgets(editorResult.data.widgets));
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
  }, [clearToast, clubId]);

  const dashboardWidgetSource = useMemo(() => {
    if (club?.admin) {
      return editorWidgets;
    }
    return widgets;
  }, [club?.admin, editorWidgets, widgets]);

  const visibleWidgets = useMemo(() => {
    if (!club) {
      return [];
    }

    return dashboardWidgetSource
      .filter((widget) => widget.enabled && widget.available)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey));
  }, [club, dashboardWidgetSource]);

  const enabledEditorWidgets = useMemo(() => {
    return editorWidgets
      .filter((widget) => widget.enabled && widget.available)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey));
  }, [editorWidgets]);

  const addableWidgets = useMemo(() => {
    if (!club?.admin) {
      return [];
    }
    return editorWidgets
      .filter((widget) => !widget.enabled && widget.available)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey));
  }, [club?.admin, editorWidgets]);

  const blockedWidgets = useMemo(() => {
    if (!club?.admin) {
      return [];
    }
    return editorWidgets
      .filter((widget) => !widget.enabled && !widget.available)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey));
  }, [club?.admin, editorWidgets]);

  const savedEnabledWidgetKeys = useMemo(
    () => extractEnabledWidgetKeys(savedEditorWidgets),
    [savedEditorWidgets],
  );
  const currentEnabledWidgetKeys = useMemo(
    () => extractEnabledWidgetKeys(editorWidgets),
    [editorWidgets],
  );
  const isEditorDirty = useMemo(
    () =>
      savedEnabledWidgetKeys.length !== currentEnabledWidgetKeys.length ||
      savedEnabledWidgetKeys.some((widgetKey, index) => widgetKey !== currentEnabledWidgetKeys[index]),
    [currentEnabledWidgetKeys, savedEnabledWidgetKeys],
  );
  const activeEditorWidget = useMemo(
    () =>
      enabledEditorWidgets.find((widget) => widget.widgetKey === activeEditorWidgetKey) ?? null,
    [activeEditorWidgetKey, enabledEditorWidgets],
  );

  const hasAttendanceWidget = useMemo(() => {
    return dashboardWidgetSource.some(
      (widget) =>
        widget.widgetKey === "ATTENDANCE_STATUS" && widget.enabled && widget.available,
    );
  }, [dashboardWidgetSource]);

  const hasMemberDirectoryWidget = useMemo(() => {
    return dashboardWidgetSource.some(
      (widget) =>
        widget.widgetKey === "MEMBER_DIRECTORY_HIGHLIGHT" && widget.enabled && widget.available,
    );
  }, [dashboardWidgetSource]);

  const hasBoardNoticeWidget = useMemo(() => {
    return dashboardWidgetSource.some(
      (widget) => widget.widgetKey === "BOARD_NOTICE" && widget.enabled && widget.available,
    );
  }, [dashboardWidgetSource]);

  const hasScheduleWidget = useMemo(() => {
    return dashboardWidgetSource.some(
      (widget) => widget.widgetKey === "SCHEDULE_OVERVIEW" && widget.enabled && widget.available,
    );
  }, [dashboardWidgetSource]);

  const hasPollWidget = useMemo(() => {
    return dashboardWidgetSource.some(
      (widget) => widget.widgetKey === "POLL_STATUS" && widget.enabled && widget.available,
    );
  }, [dashboardWidgetSource]);

  const hasTournamentWidget = useMemo(() => {
    return dashboardWidgetSource.some(
      (widget) => widget.widgetKey === "TOURNAMENT_RECORD_LATEST" && widget.enabled && widget.available,
    );
  }, [dashboardWidgetSource]);

  const hasBracketWidget = useMemo(() => {
    return dashboardWidgetSource.some(
      (widget) => widget.widgetKey === "BRACKET_LATEST" && widget.enabled && widget.available,
    );
  }, [dashboardWidgetSource]);

  const hasDuesWidget = useMemo(() => {
    return dashboardWidgetSource.some(
      (widget) => widget.widgetKey === "DUES_STATUS" && widget.enabled && widget.available,
    );
  }, [dashboardWidgetSource]);

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

  const loadBoardData = useCallback(async () => {
    if (!hasBoardNoticeWidget) {
      return;
    }

    setBoardLoading(true);
    setBoardError(null);
    const result = await getClubBoard(clubId);
    if (!result.ok || !result.data) {
      setBoardData(null);
      setBoardError(result.message ?? "공지 정보를 불러오지 못했습니다.");
      setBoardLoading(false);
      return;
    }

    setBoardData(result.data);
    setBoardLoading(false);
  }, [clubId, hasBoardNoticeWidget]);

  const loadMemberDirectoryData = useCallback(async () => {
    if (!hasMemberDirectoryWidget) {
      return;
    }

    setMemberDirectoryLoading(true);
    setMemberDirectoryError(null);
    const result = await getClubMemberDirectory(clubId);
    if (!result.ok || !result.data) {
      setMemberDirectoryData(null);
      setMemberDirectoryError(result.message ?? "회원 디렉터리 정보를 불러오지 못했습니다.");
      setMemberDirectoryLoading(false);
      return;
    }

    setMemberDirectoryData(result.data);
    setMemberDirectoryLoading(false);
  }, [clubId, hasMemberDirectoryWidget]);

  const loadDuesData = useCallback(async () => {
    if (!hasDuesWidget) {
      return;
    }

    setDuesLoading(true);
    setDuesError(null);
    const result = await getClubDues(clubId);
    if (!result.ok || !result.data) {
      setDuesData(null);
      setDuesError(result.message ?? "회비 정보를 불러오지 못했습니다.");
      setDuesLoading(false);
      return;
    }

    setDuesData(result.data);
    setDuesLoading(false);
  }, [clubId, hasDuesWidget]);

  const loadScheduleData = useCallback(async () => {
    if (!hasScheduleWidget) {
      return;
    }

    setScheduleLoading(true);
    setScheduleError(null);
    const today = new Date();
    const result = await getClubSchedule(clubId, {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    });
    if (!result.ok || !result.data) {
      setScheduleData(null);
      setScheduleError(result.message ?? "일정 정보를 불러오지 못했습니다.");
      setScheduleLoading(false);
      return;
    }

    setScheduleData(result.data);
    setScheduleLoading(false);
  }, [clubId, hasScheduleWidget]);

  const loadPollData = useCallback(async () => {
    if (!hasPollWidget) {
      return;
    }

    setPollLoading(true);
    setPollError(null);
    const result = await getClubPollHome(clubId);
    if (!result.ok || !result.data) {
      setPollData(null);
      setPollError(result.message ?? "투표 정보를 불러오지 못했습니다.");
      setPollLoading(false);
      return;
    }

    setPollData(result.data);
    setPollLoading(false);
  }, [clubId, hasPollWidget]);

  const loadTournamentData = useCallback(async () => {
    if (!hasTournamentWidget) {
      return;
    }

    setTournamentLoading(true);
    setTournamentError(null);
    const result = await getClubTournamentHome(clubId);
    if (!result.ok || !result.data) {
      setTournamentData(null);
      setTournamentError(result.message ?? "대회 정보를 불러오지 못했습니다.");
      setTournamentLoading(false);
      return;
    }

    setTournamentData(result.data);
    setTournamentLoading(false);
  }, [clubId, hasTournamentWidget]);

  const loadBracketData = useCallback(async () => {
    if (!hasBracketWidget) {
      return;
    }

    setBracketLoading(true);
    setBracketError(null);
    const result = await getClubBracketHome(clubId);
    if (!result.ok || !result.data) {
      setBracketData(null);
      setBracketError(result.message ?? "대진표 정보를 불러오지 못했습니다.");
      setBracketLoading(false);
      return;
    }

    setBracketData(result.data);
    setBracketLoading(false);
  }, [clubId, hasBracketWidget]);

  const persistEditorWidgets = useCallback(
    async (nextWidgets: ClubDashboardWidgetSummary[], successMessage: string) => {
      if (!club?.admin) {
        return;
      }

      setIsSaving(true);
      clearToast();
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
        showToast(result.message ?? "위젯 저장에 실패했습니다.", "error");
        return;
      }

      setEditor(result.data);
      setEditorWidgets(cloneWidgets(result.data.widgets));
      setSavedEditorWidgets(cloneWidgets(result.data.widgets));
      showToast(successMessage, "success");
      window.dispatchEvent(new Event("semo:dashboard-widgets-updated"));
    },
    [clearToast, club?.admin, clubId, showToast],
  );

  const handleRemoveWidget = (widgetKey: string) => {
    if (!club?.admin || isSaving) {
      return;
    }

    startTransition(() => {
      setEditorWidgets((current) =>
        normalizeSortOrder(
          current.map((widget) =>
        widget.widgetKey === widgetKey ? { ...widget, enabled: false } : widget,
          ),
        ),
      );
    });
  };

  const handleAddWidget = (widgetKey: string) => {
    if (!club?.admin || isSaving) {
      return;
    }

    startTransition(() => {
      setEditorWidgets((current) =>
        normalizeSortOrder(
          current.map((widget) =>
        widget.widgetKey === widgetKey ? { ...widget, enabled: true } : widget,
          ),
        ),
      );
    });
  };

  const reorderEditorWidgets = useCallback(
    (sourceWidgetKey: string, targetWidgetKey: string) => {
      if (!club?.admin || isSaving || sourceWidgetKey === targetWidgetKey) {
        return;
      }

      startTransition(() => {
        setEditorWidgets((current) =>
          reorderEnabledWidgets(current, sourceWidgetKey, targetWidgetKey),
        );
      });
    },
    [club?.admin, isSaving],
  );

  const handleEditorDragStart = (event: DragStartEvent) => {
    setActiveEditorWidgetKey(String(event.active.id));
  };

  const handleEditorDragEnd = (event: DragEndEvent) => {
    setActiveEditorWidgetKey(null);
    const activeId = String(event.active.id);
    const overId = event.over?.id == null ? null : String(event.over.id);
    if (overId == null || activeId === overId) {
      return;
    }
    reorderEditorWidgets(activeId, overId);
  };

  const handleSaveEditor = async () => {
    if (!club?.admin) {
      return;
    }
    await persistEditorWidgets(editorWidgets, "홈 위젯 구성이 저장되었습니다.");
  };

  const handleResetEditor = () => {
    setActiveEditorWidgetKey(null);
    setEditorWidgets(cloneWidgets(savedEditorWidgets));
    showToast("위젯 편집 초안을 되돌렸습니다.", "info");
  };

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

  useEffect(() => {
    if (!hasBoardNoticeWidget) {
      return;
    }
    const timerId = window.setTimeout(() => {
      void loadBoardData();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasBoardNoticeWidget, loadBoardData]);

  useEffect(() => {
    if (!hasMemberDirectoryWidget) {
      return;
    }
    const timerId = window.setTimeout(() => {
      void loadMemberDirectoryData();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasMemberDirectoryWidget, loadMemberDirectoryData]);

  useEffect(() => {
    if (!hasDuesWidget) {
      return;
    }
    const timerId = window.setTimeout(() => {
      void loadDuesData();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasDuesWidget, loadDuesData]);

  useEffect(() => {
    if (!hasScheduleWidget) {
      return;
    }
    const timerId = window.setTimeout(() => {
      void loadScheduleData();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasScheduleWidget, loadScheduleData]);

  useEffect(() => {
    if (!hasPollWidget) {
      return;
    }
    const timerId = window.setTimeout(() => {
      void loadPollData();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasPollWidget, loadPollData]);

  useEffect(() => {
    if (!hasTournamentWidget) {
      return;
    }
    const timerId = window.setTimeout(() => {
      void loadTournamentData();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasTournamentWidget, loadTournamentData]);

  useEffect(() => {
    if (!hasBracketWidget) {
      return;
    }
    const timerId = window.setTimeout(() => {
      void loadBracketData();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasBracketWidget, loadBracketData]);

  const handleAttendanceCheckIn = useCallback(async () => {
    const todayAttendance = attendanceData?.todayAttendance;
    if (!todayAttendance || !todayAttendance.canCheckIn || isCheckingInAttendance) {
      return;
    }

    setIsCheckingInAttendance(true);
    clearToast();
    const result = await checkInClubAttendance(clubId);
    setIsCheckingInAttendance(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "출석 처리에 실패했습니다.", "error");
      return;
    }

    showToast("출석이 완료되었습니다.", "success");
    setAttendancePulseToken((current) => current + 1);
    await loadAttendanceData();
  }, [attendanceData?.todayAttendance, clearToast, clubId, isCheckingInAttendance, loadAttendanceData, showToast]);

  if (isLoading && !club && !error) {
    return <ClubDashboardLoadingShell />;
  }

  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative flex min-h-full w-full flex-col">
        <ClubPageHeader
          title={club?.name ?? "모임 홈"}
          subtitle={club?.admin ? "운영자 모드" : "사용자 모드"}
          icon="home"
          rightSlot={
            club?.admin ? (
              <button
                type="button"
                onClick={() => {
                  clearToast();
                  if (editMode && isEditorDirty) {
                    showToast("저장하거나 되돌린 뒤 편집을 종료할 수 있습니다.", "info");
                    return;
                  }
                  setEditMode((current) => !current);
                }}
                className="rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
              >
                {editMode ? "완료" : "편집"}
              </button>
            ) : null
          }
        />

        <main className="semo-nav-bottom-space flex-1 space-y-6 p-4 md:p-6">
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
                  {club?.admin ? (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      editMode
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {editMode ? "Widget Edit Mode" : "Home Widgets"}
                    </span>
                  ) : null}
                </div>
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
            ) : club?.admin && editMode ? (
              <div className="space-y-6">
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--primary)]">view_quilt</span>
                    <h3 className="text-lg font-bold text-slate-900">활성 위젯 순서</h3>
                  </div>
                  {enabledEditorWidgets.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                      현재 홈에 노출 중인 위젯이 없습니다.
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleEditorDragStart}
                      onDragEnd={handleEditorDragEnd}
                      onDragCancel={() => {
                        setActiveEditorWidgetKey(null);
                      }}
                    >
                      <SortableContext
                        items={enabledEditorWidgets.map((widget) => widget.widgetKey)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-3">
                          {enabledEditorWidgets.map((widget) => (
                            <EnabledDashboardWidgetCard
                              key={widget.widgetKey}
                              widget={widget}
                              onRemove={handleRemoveWidget}
                            />
                          ))}
                        </div>
                      </SortableContext>
                      <DragOverlay dropAnimation={null}>
                        {activeEditorWidget ? (
                          <EnabledDashboardWidgetOverlayCard widget={activeEditorWidget} />
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  )}
                </section>

                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--primary)]">add_circle</span>
                    <h3 className="text-lg font-bold text-slate-900">추가 가능 위젯</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {addableWidgets.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                        추가 가능한 위젯이 없습니다.
                      </div>
                    ) : (
                      addableWidgets.map((widget) => (
                        <article
                          key={widget.widgetKey}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                        >
                          <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${WIDGET_ACCENT_CLASS[widget.widgetKey] ?? "bg-slate-100 text-slate-600"}`}>
                            <span className="material-symbols-outlined text-[22px]">{widget.iconName}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-bold text-slate-900">{widget.displayName}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              {widget.description ?? "홈에서 빠르게 확인할 수 있는 위젯입니다."}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddWidget(widget.widgetKey)}
                            className="rounded-full bg-[var(--primary)]/10 px-4 py-2 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/20"
                          >
                            추가
                          </button>
                        </article>
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-500">lock</span>
                    <h3 className="text-lg font-bold text-slate-900">현재 사용할 수 없는 위젯</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {blockedWidgets.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
                        기능 비활성 때문에 막힌 위젯이 없습니다.
                      </div>
                    ) : (
                      blockedWidgets.map((widget) => (
                        <article
                          key={widget.widgetKey}
                          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm"
                        >
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
                            <span className="material-symbols-outlined text-[22px]">{widget.iconName}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-bold text-slate-900">{widget.displayName}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {getWidgetFeatureLabel(widget)}
                            </p>
                          </div>
                          <RouterLink
                            href={`/clubs/${clubId}/admin/menu`}
                            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-100"
                          >
                            기능 켜기
                          </RouterLink>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {visibleWidgets.map((widget) => (
                  <DashboardWidgetCard
                    key={widget.widgetKey}
                    clubId={clubId}
                    widget={widget}
                    editMode={false}
                    isAdmin={Boolean(club?.admin)}
                    isDragging={false}
                    isDropTarget={false}
                    isDisabled={isSaving}
                    reduceMotion={reduceMotion}
                    attendanceData={widget.widgetKey === "ATTENDANCE_STATUS" ? attendanceData : null}
                    attendanceLoading={widget.widgetKey === "ATTENDANCE_STATUS" && attendanceLoading}
                    attendanceError={widget.widgetKey === "ATTENDANCE_STATUS" ? attendanceError : null}
                    memberDirectoryData={widget.widgetKey === "MEMBER_DIRECTORY_HIGHLIGHT" ? memberDirectoryData : null}
                    memberDirectoryLoading={widget.widgetKey === "MEMBER_DIRECTORY_HIGHLIGHT" && memberDirectoryLoading}
                    memberDirectoryError={widget.widgetKey === "MEMBER_DIRECTORY_HIGHLIGHT" ? memberDirectoryError : null}
                    duesData={widget.widgetKey === "DUES_STATUS" ? duesData : null}
                    duesLoading={widget.widgetKey === "DUES_STATUS" && duesLoading}
                    duesError={widget.widgetKey === "DUES_STATUS" ? duesError : null}
                    boardData={widget.widgetKey === "BOARD_NOTICE" ? boardData : null}
                    boardLoading={widget.widgetKey === "BOARD_NOTICE" && boardLoading}
                    boardError={widget.widgetKey === "BOARD_NOTICE" ? boardError : null}
                    scheduleData={widget.widgetKey === "SCHEDULE_OVERVIEW" ? scheduleData : null}
                    scheduleLoading={widget.widgetKey === "SCHEDULE_OVERVIEW" && scheduleLoading}
                    scheduleError={widget.widgetKey === "SCHEDULE_OVERVIEW" ? scheduleError : null}
                    pollData={widget.widgetKey === "POLL_STATUS" ? pollData : null}
                    pollLoading={widget.widgetKey === "POLL_STATUS" && pollLoading}
                    pollError={widget.widgetKey === "POLL_STATUS" ? pollError : null}
                    tournamentData={widget.widgetKey === "TOURNAMENT_RECORD_LATEST" ? tournamentData : null}
                    tournamentLoading={widget.widgetKey === "TOURNAMENT_RECORD_LATEST" && tournamentLoading}
                    tournamentError={widget.widgetKey === "TOURNAMENT_RECORD_LATEST" ? tournamentError : null}
                    bracketData={widget.widgetKey === "BRACKET_LATEST" ? bracketData : null}
                    bracketLoading={widget.widgetKey === "BRACKET_LATEST" && bracketLoading}
                    bracketError={widget.widgetKey === "BRACKET_LATEST" ? bracketError : null}
                    attendancePulseToken={widget.widgetKey === "ATTENDANCE_STATUS" ? attendancePulseToken : 0}
                    isCheckingInAttendance={widget.widgetKey === "ATTENDANCE_STATUS" && isCheckingInAttendance}
                    onRemove={() => {}}
                    onAttendanceCheckIn={handleAttendanceCheckIn}
                    onDragStart={() => {}}
                    onDragOver={() => {}}
                    onDrop={() => {}}
                    onDragEnd={() => {}}
                    onTouchDragStart={() => {}}
                  />
                ))}
                {!dashboardLoading && !dashboardError && visibleWidgets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                    표시할 홈 위젯이 없습니다.
                  </div>
                ) : null}
              </div>
            )}
          </motion.section>
        </main>

        {club?.admin && editMode && isEditorDirty ? (
          <div className="pointer-events-none fixed bottom-[76px] left-0 right-0 z-30 p-4">
            <div className="pointer-events-auto mx-auto max-w-5xl">
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <button
                  type="button"
                  onClick={handleResetEditor}
                  disabled={isSaving}
                  aria-label="위젯 편집 초안 되돌리기"
                  title="위젯 편집 초안 되돌리기"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveEditor()}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-[0_18px_36px_rgba(19,91,236,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined">
                    {isSaving ? "progress_activity" : "save"}
                  </span>
                  {isSaving ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {club?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <EphemeralToast toastId={toast?.id ?? null} message={toast?.message ?? null} tone={toast?.tone} />
      </div>
    </div>
  );
}
