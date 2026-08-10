"use client";

import { RouterLink } from "@/app/components/RouterLink";
import {
  getWidgetDescription,
  getWidgetTitle,
  isAttendanceWidgetKey,
  isDecisionWidgetKey,
  WIDGET_ACCENT_CLASS,
} from "../utils/dashboardWidgetUtils";
import type { ClubDashboardWidgetCardProps } from "../types/dashboardWidgetTypes";
import { ClubDashboardWidgetFeatureContent } from "./ClubDashboardWidgetFeatureContent";
import { ClubDashboardWidgetPersonalContent } from "./ClubDashboardWidgetPersonalContent";

export function ClubDashboardWidgetContent(props: ClubDashboardWidgetCardProps) {
  const { clubId, widget, editMode, isAdmin } =
    props;
  const accentClass = WIDGET_ACCENT_CLASS[widget.widgetKey] ?? "bg-slate-100 text-slate-600";
  const isEditMode = isAdmin && editMode;

  return (
    <>
      <div className={`mb-4 flex items-center gap-3 ${isEditMode ? "pr-12 pl-10" : "pr-12"}`}>
        <div className={`flex size-10 items-center justify-center rounded-lg ${accentClass}`}>
          <span className="material-symbols-outlined text-xl" aria-hidden="true">{widget.iconName}</span>
        </div>
        <div>
          <h3 className="text-base font-bold">{getWidgetTitle(widget)}</h3>
          {!widget.available ? <p className="text-xs font-semibold text-amber-600">필요한 기능이 비활성화되어 있습니다</p> : null}
        </div>
      </div>

      <ClubDashboardWidgetPersonalContent {...props} />
      <ClubDashboardWidgetFeatureContent {...props} />
      {!matchesKnownWidget(widget.widgetKey) ? (
        <p className="text-sm text-slate-500">{getWidgetDescription(widget)}</p>
      ) : null}

      <div className="mt-auto pt-5">
        {isEditMode ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
            드래그해서 순서 변경
          </span>
        ) : (
          <RouterLink
            href={widget.userPath || `/clubs/${clubId}`}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
          >
            열기
            <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
          </RouterLink>
        )}
      </div>
    </>
  );
}

function matchesKnownWidget(widgetKey: string) {
  return (
    isAttendanceWidgetKey(widgetKey) ||
    isDecisionWidgetKey(widgetKey) ||
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
