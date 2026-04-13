"use client";

import { motion } from "motion/react";
import { RouterLink } from "@/app/components/RouterLink";
import { isAttendanceWidgetKey, WIDGET_ACCENT_CLASS } from "./dashboardWidgetUtils";
import type { ClubDashboardWidgetCardProps } from "./dashboardWidgetTypes";
import { ClubDashboardWidgetFeatureContent } from "./ClubDashboardWidgetFeatureContent";
import { ClubDashboardWidgetPersonalContent } from "./ClubDashboardWidgetPersonalContent";

export function ClubDashboardWidgetContent(props: ClubDashboardWidgetCardProps) {
  const { clubId, widget, editMode, isAdmin, reduceMotion, attendanceData, attendanceLoading, isCheckingInAttendance, onAttendanceCheckIn } =
    props;
  const accentClass = WIDGET_ACCENT_CLASS[widget.widgetKey] ?? "bg-slate-100 text-slate-600";
  const isEditMode = isAdmin && editMode;
  const isAttendanceStatusWidget = widget.widgetKey === "ATTENDANCE_STATUS";
  const todayAttendance = attendanceData?.todayAttendance;

  return (
    <>
      <div className={`mb-4 flex items-center gap-3 ${isEditMode ? "pr-12 pl-10" : "pr-12"}`}>
        <div className={`flex size-10 items-center justify-center rounded-lg ${accentClass}`}>
          <span className="material-symbols-outlined text-xl">{widget.iconName}</span>
        </div>
        <div>
          <h3 className="text-base font-bold">{widget.title}</h3>
          {!widget.available ? <p className="text-xs font-semibold text-amber-600">Required feature is disabled</p> : null}
        </div>
      </div>

      <ClubDashboardWidgetPersonalContent {...props} />
      <ClubDashboardWidgetFeatureContent {...props} />
      {!matchesKnownWidget(widget.widgetKey) ? (
        <p className="text-sm text-slate-500">{widget.description ?? "No widget description yet."}</p>
      ) : null}

      <div className="mt-auto pt-5">
        {isEditMode ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
            Drag to reorder
          </span>
        ) : isAttendanceStatusWidget && todayAttendance?.canCheckIn && !todayAttendance.checkedIn ? (
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
              animate={isCheckingInAttendance && !reduceMotion ? { rotate: 360 } : { rotate: 0 }}
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
      </div>
    </>
  );
}

function matchesKnownWidget(widgetKey: string) {
  return (
    isAttendanceWidgetKey(widgetKey) ||
    widgetKey === "FINANCE_STATUS" ||
    widgetKey === "FINANCE_LEDGER" ||
    widgetKey === "BOARD_NOTICE" ||
    widgetKey === "BOARD_STRIP" ||
    widgetKey === "SCHEDULE_OVERVIEW" ||
    widgetKey === "SCHEDULE_INSIGHT" ||
    widgetKey === "POLL_STATUS" ||
    widgetKey === "POLL_PULSE" ||
    widgetKey === "TOURNAMENT_RECORD_LATEST" ||
    widgetKey === "TOURNAMENT_RECORD_MINE" ||
    widgetKey === "BRACKET_LATEST" ||
    widgetKey === "BRACKET_WORKBENCH"
  );
}
