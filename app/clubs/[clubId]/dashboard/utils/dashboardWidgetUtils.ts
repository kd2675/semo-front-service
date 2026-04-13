import {
  type ClubDashboardWidgetSummary,
  type ClubScheduleResponse,
} from "@/app/lib/clubs";

const ATTENDANCE_WIDGET_KEYS = new Set(["ATTENDANCE_STATUS", "ATTENDANCE_RECENT"]);
const BOARD_WIDGET_KEYS = new Set(["BOARD_NOTICE", "BOARD_STRIP"]);
const BRACKET_WIDGET_KEYS = new Set(["BRACKET_LATEST", "BRACKET_WORKBENCH"]);
const FINANCE_WIDGET_KEYS = new Set(["FINANCE_STATUS", "FINANCE_LEDGER"]);
const POLL_WIDGET_KEYS = new Set(["POLL_STATUS", "POLL_PULSE"]);
const SCHEDULE_WIDGET_KEYS = new Set(["SCHEDULE_OVERVIEW", "SCHEDULE_INSIGHT"]);
const TOURNAMENT_WIDGET_KEYS = new Set([
  "TOURNAMENT_RECORD_LATEST",
  "TOURNAMENT_RECORD_MINE",
]);

export const WIDGET_ACCENT_CLASS: Record<string, string> = {
  BOARD_NOTICE: "bg-blue-50 text-blue-600",
  BOARD_STRIP: "bg-sky-50 text-sky-600",
  SCHEDULE_OVERVIEW: "bg-amber-50 text-amber-600",
  SCHEDULE_INSIGHT: "bg-orange-50 text-orange-600",
  POLL_STATUS: "bg-amber-50 text-amber-500",
  POLL_PULSE: "bg-orange-50 text-orange-500",
  PROFILE_SUMMARY: "bg-emerald-50 text-emerald-600",
  ATTENDANCE_STATUS: "bg-indigo-50 text-indigo-600",
  ATTENDANCE_RECENT: "bg-violet-50 text-violet-600",
  FINANCE_STATUS: "bg-emerald-50 text-emerald-700",
  FINANCE_LEDGER: "bg-teal-50 text-teal-700",
  TOURNAMENT_RECORD_LATEST: "bg-emerald-50 text-emerald-700",
  TOURNAMENT_RECORD_MINE: "bg-lime-50 text-lime-700",
  BRACKET_LATEST: "bg-amber-50 text-amber-700",
  BRACKET_WORKBENCH: "bg-yellow-50 text-yellow-700",
};

export function isAttendanceWidgetKey(widgetKey: string) {
  return ATTENDANCE_WIDGET_KEYS.has(widgetKey);
}

export function isBoardWidgetKey(widgetKey: string) {
  return BOARD_WIDGET_KEYS.has(widgetKey);
}

export function isBracketWidgetKey(widgetKey: string) {
  return BRACKET_WIDGET_KEYS.has(widgetKey);
}

export function isFinanceWidgetKey(widgetKey: string) {
  return FINANCE_WIDGET_KEYS.has(widgetKey);
}

export function isPollWidgetKey(widgetKey: string) {
  return POLL_WIDGET_KEYS.has(widgetKey);
}

export function isScheduleWidgetKey(widgetKey: string) {
  return SCHEDULE_WIDGET_KEYS.has(widgetKey);
}

export function isTournamentWidgetKey(widgetKey: string) {
  return TOURNAMENT_WIDGET_KEYS.has(widgetKey);
}

export function hasEnabledAvailableWidget(
  widgets: ClubDashboardWidgetSummary[],
  predicate: (widgetKey: string) => boolean,
) {
  return widgets.some(
    (widget) => predicate(widget.widgetKey) && widget.enabled && widget.available,
  );
}

export function getScheduleItemDate(item: ClubScheduleResponse["items"][number]) {
  if (item.contentType === "SCHEDULE_EVENT" && item.event) {
    return item.event.startDate;
  }
  if (item.contentType === "SCHEDULE_VOTE" && item.vote) {
    return item.vote.voteStartDate;
  }
  if (item.contentType === "NOTICE" && item.notice?.scheduleAt) {
    return item.notice.scheduleAt.slice(0, 10);
  }
  return null;
}

export function getFinanceStatusClassName(paymentStatusCode: string) {
  if (paymentStatusCode === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (paymentStatusCode === "WAIVED") {
    return "bg-slate-200 text-slate-600";
  }
  if (paymentStatusCode === "OVERDUE") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-amber-50 text-amber-700";
}

function sortWidgetsByOrder(widgets: ClubDashboardWidgetSummary[]) {
  return [...widgets].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.widgetKey.localeCompare(b.widgetKey),
  );
}

export function normalizeSortOrder(widgets: ClubDashboardWidgetSummary[]) {
  const enabledKeys = sortWidgetsByOrder(widgets.filter((widget) => widget.enabled)).map(
    (widget) => widget.widgetKey,
  );
  const sortOrderByKey = new Map(enabledKeys.map((key, index) => [key, (index + 1) * 10]));
  return widgets.map((widget) =>
    widget.enabled
      ? { ...widget, sortOrder: sortOrderByKey.get(widget.widgetKey) ?? widget.sortOrder }
      : widget,
  );
}

export function cloneWidgets(widgets: ClubDashboardWidgetSummary[]) {
  return widgets.map((widget) => ({ ...widget }));
}

export function extractEnabledWidgetKeys(widgets: ClubDashboardWidgetSummary[]) {
  return sortWidgetsByOrder(widgets.filter((widget) => widget.enabled)).map(
    (widget) => widget.widgetKey,
  );
}

export function reorderEnabledWidgets(
  widgets: ClubDashboardWidgetSummary[],
  draggedWidgetKey: string,
  targetWidgetKey: string,
) {
  if (draggedWidgetKey === targetWidgetKey) {
    return widgets;
  }

  const enabledWidgets = sortWidgetsByOrder(widgets.filter((widget) => widget.enabled));
  const sourceIndex = enabledWidgets.findIndex(
    (widget) => widget.widgetKey === draggedWidgetKey,
  );
  const targetIndex = enabledWidgets.findIndex(
    (widget) => widget.widgetKey === targetWidgetKey,
  );
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

export function getWidgetFeatureLabel(widget: ClubDashboardWidgetSummary) {
  if (!widget.requiredFeatureKey) {
    return "기본 위젯";
  }
  return `${widget.requiredFeatureKey} 기능 필요`;
}
