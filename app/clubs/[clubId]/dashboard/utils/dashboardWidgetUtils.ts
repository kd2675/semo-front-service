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

const WIDGET_COPY: Record<string, { title: string; description: string }> = {
  BOARD_NOTICE: {
    title: "최근 공지",
    description: "게시판의 최신 공지를 바로 확인합니다.",
  },
  BOARD_STRIP: {
    title: "공지 모아보기",
    description: "최근 공지를 간결한 목록으로 확인합니다.",
  },
  SCHEDULE_OVERVIEW: {
    title: "오늘 일정",
    description: "오늘 예정된 일정과 주요 항목을 확인합니다.",
  },
  SCHEDULE_INSIGHT: {
    title: "일정 요약",
    description: "다가오는 일정과 투표, 공지 현황을 확인합니다.",
  },
  POLL_STATUS: {
    title: "진행 중인 투표",
    description: "클럽에서 진행 중인 최신 투표를 확인합니다.",
  },
  POLL_PULSE: {
    title: "투표 현황",
    description: "대기, 진행 중, 마감된 투표 수를 확인합니다.",
  },
  PROFILE_SUMMARY: {
    title: "내 프로필",
    description: "클럽 프로필을 바로 확인하고 관리합니다.",
  },
  TOURNAMENT_RECORD_LATEST: {
    title: "대회 센터",
    description: "주요 대회와 내게 가까운 대회를 확인합니다.",
  },
  TOURNAMENT_RECORD_MINE: {
    title: "내 대회",
    description: "내 대회 신청과 참가 현황을 확인합니다.",
  },
  BRACKET_LATEST: {
    title: "대진표",
    description: "승인된 대진표와 내 최신 초안을 확인합니다.",
  },
  BRACKET_WORKBENCH: {
    title: "대진표 작업실",
    description: "대진표 초안과 검토 상태를 확인합니다.",
  },
  ATTENDANCE_STATUS: {
    title: "출석 체크",
    description: "출석하고 오늘의 출석 상태를 확인합니다.",
  },
  ATTENDANCE_RECENT: {
    title: "최근 출석",
    description: "최근 출석 기록과 출석률을 확인합니다.",
  },
  FINANCE_STATUS: {
    title: "내 납부 현황",
    description: "미납 항목과 최근 납부 상태를 확인합니다.",
  },
  FINANCE_LEDGER: {
    title: "회비 요약",
    description: "미납 및 납부 완료 회비를 한눈에 확인합니다.",
  },
};

export function getWidgetDisplayName(widget: ClubDashboardWidgetSummary) {
  return WIDGET_COPY[widget.widgetKey]?.title ?? widget.displayName;
}

export function getWidgetTitle(widget: ClubDashboardWidgetSummary) {
  if (widget.title !== widget.displayName) {
    return widget.title;
  }
  return getWidgetDisplayName(widget);
}

export function getWidgetDescription(widget: ClubDashboardWidgetSummary) {
  return WIDGET_COPY[widget.widgetKey]?.description
    ?? widget.description
    ?? "홈에서 빠르게 확인할 수 있는 위젯입니다.";
}

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
  const featureName = {
    ATTENDANCE: "출석",
    BRACKET: "대진표",
    FINANCE: "회비",
    POLL: "투표",
    TOURNAMENT_RECORD: "대회",
  }[widget.requiredFeatureKey] ?? widget.requiredFeatureKey;
  return `${featureName} 기능 필요`;
}
