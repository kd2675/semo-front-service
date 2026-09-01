"use client";

import {
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { ClubGrowthCorePanel } from "@/app/components/ClubGrowthCorePanel";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { useAppToast } from "@/app/hooks/useAppToast";
import {
  getClubScheduleAttendanceSummary,
  getClubFinance,
  getClubBoard,
  getClubBracketHome,
  getClubScheduleVoteSummary,
  getClubSchedule,
  getClubTournamentHome,
  type ClubScheduleAttendanceSummaryResponse,
  type ClubBoardResponse,
  type ClubBracketHomeResponse,
  type ClubFinanceHomeResponse,
  type ClubScheduleVoteSummaryResponse,
  type ClubTournamentHomeResponse,
  type ClubDashboardWidgetSummary,
  type ClubScheduleResponse,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { getClubDecisionLog, type ClubDecisionLog } from "@/app/lib/semo/decision";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import {
  updateDashboardWidgetsMutationOptions,
} from "@/app/lib/react-query/club/mutations";
import {
  dashboardWidgetEditorQueryOptions,
  dashboardWidgetsQueryOptions,
  myClubQueryOptions,
} from "@/app/lib/react-query/club/queries";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import {
  ClubDashboardLoadingShell,
  ClubDashboardWidgetGridShell,
} from "../ClubRouteLoadingShells";
import { ClubDashboardWidgetEditor } from "./components/ClubDashboardWidgetEditor";
import { ClubDashboardWidgetCard } from "./components/ClubDashboardWidgetCard";
import {
  cloneWidgets,
  extractEnabledWidgetKeys,
  hasEnabledAvailableWidget,
  isAttendanceWidgetKey,
  isBoardWidgetKey,
  isBracketWidgetKey,
  isFinanceWidgetKey,
  isPollWidgetKey,
  isScheduleWidgetKey,
  isTournamentWidgetKey,
  isDecisionWidgetKey,
  normalizeSortOrder,
  reorderEnabledWidgets,
} from "./utils/dashboardWidgetUtils";

type ClubDashboardFallbackClientProps = {
  clubId: string;
};

export function ClubDashboardFallbackClient({
  clubId,
}: ClubDashboardFallbackClientProps) {
  const queryClient = useQueryClient();
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const clubQuery = useQuery(myClubQueryOptions(clubId));
  const club = clubQuery.data ?? null;
  const [editorWidgetsState, setEditorWidgets] = useState<ClubDashboardWidgetSummary[] | null>(null);
  const [savedEditorWidgetsState, setSavedEditorWidgets] = useState<ClubDashboardWidgetSummary[] | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeEditorWidgetKey, setActiveEditorWidgetKey] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<ClubScheduleAttendanceSummaryResponse | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [financeData, setFinanceData] = useState<ClubFinanceHomeResponse | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<ClubBoardResponse | null>(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<ClubScheduleResponse | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [pollData, setPollData] = useState<ClubScheduleVoteSummaryResponse | null>(null);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [tournamentData, setTournamentData] = useState<ClubTournamentHomeResponse | null>(null);
  const [tournamentLoading, setTournamentLoading] = useState(false);
  const [tournamentError, setTournamentError] = useState<string | null>(null);
  const [bracketData, setBracketData] = useState<ClubBracketHomeResponse | null>(null);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [bracketError, setBracketError] = useState<string | null>(null);
  const [decisionData, setDecisionData] = useState<ClubDecisionLog | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const { showToast, clearToast } = useAppToast();
  const saveWidgetsMutation = useMutation(updateDashboardWidgetsMutationOptions(clubId, "USER_HOME"));
  const editorQuery = useQuery({
    ...dashboardWidgetEditorQueryOptions(clubId, "USER_HOME"),
    enabled: club?.admin === true,
  });
  const widgetsQuery = useQuery({
    ...dashboardWidgetsQueryOptions(clubId, "USER_HOME"),
    enabled: club?.admin === false,
  });
  useEffect(() => {
    clearToast();
  }, [clearToast, clubId]);

  const error =
    !clubQuery.isPending && clubQuery.isError
      ? getQueryErrorMessage(clubQuery.error, "클럽 정보를 불러오지 못했습니다.")
      : null;
  const isLoading = clubQuery.isPending;
  const widgets = useMemo(() => widgetsQuery.data ?? [], [widgetsQuery.data]);
  const editorWidgets = useMemo(
    () => editorWidgetsState ?? (editorQuery.data ? cloneWidgets(editorQuery.data.widgets) : []),
    [editorQuery.data, editorWidgetsState],
  );
  const savedEditorWidgets = useMemo(
    () =>
      savedEditorWidgetsState ?? (editorQuery.data ? cloneWidgets(editorQuery.data.widgets) : []),
    [editorQuery.data, savedEditorWidgetsState],
  );
  const dashboardLoading = club?.admin === true ? editorQuery.isPending : club?.admin === false ? widgetsQuery.isPending : false;
  const dashboardError =
    club?.admin === true
      ? !editorQuery.isPending && editorQuery.isError
        ? getQueryErrorMessage(editorQuery.error, "홈 위젯 편집 정보를 불러오지 못했습니다.")
        : null
      : club?.admin === false
        ? !widgetsQuery.isPending && widgetsQuery.isError
          ? getQueryErrorMessage(widgetsQuery.error, "홈 위젯을 불러오지 못했습니다.")
          : null
        : null;

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

  const hasAttendanceWidget = useMemo(
    () => hasEnabledAvailableWidget(dashboardWidgetSource, isAttendanceWidgetKey),
    [dashboardWidgetSource],
  );
  const hasBoardNoticeWidget = useMemo(
    () => hasEnabledAvailableWidget(dashboardWidgetSource, isBoardWidgetKey),
    [dashboardWidgetSource],
  );
  const hasScheduleWidget = useMemo(
    () => hasEnabledAvailableWidget(dashboardWidgetSource, isScheduleWidgetKey),
    [dashboardWidgetSource],
  );
  const hasPollWidget = useMemo(
    () => hasEnabledAvailableWidget(dashboardWidgetSource, isPollWidgetKey),
    [dashboardWidgetSource],
  );
  const hasTournamentWidget = useMemo(
    () => hasEnabledAvailableWidget(dashboardWidgetSource, isTournamentWidgetKey),
    [dashboardWidgetSource],
  );
  const hasBracketWidget = useMemo(
    () => hasEnabledAvailableWidget(dashboardWidgetSource, isBracketWidgetKey),
    [dashboardWidgetSource],
  );
  const hasFinanceWidget = useMemo(
    () => hasEnabledAvailableWidget(dashboardWidgetSource, isFinanceWidgetKey),
    [dashboardWidgetSource],
  );
  const hasDecisionWidget = useMemo(
    () => hasEnabledAvailableWidget(dashboardWidgetSource, isDecisionWidgetKey),
    [dashboardWidgetSource],
  );

  const loadAttendanceData = useCallback(async () => {
    if (!hasAttendanceWidget) {
      return;
    }

    setAttendanceLoading(true);
    setAttendanceError(null);
    const result = await getClubScheduleAttendanceSummary(clubId);
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

  const loadFinanceData = useCallback(async () => {
    if (!hasFinanceWidget) {
      return;
    }

    setFinanceLoading(true);
    setFinanceError(null);
    const result = await getClubFinance(clubId);
    if (!result.ok || !result.data) {
      setFinanceData(null);
      setFinanceError(result.message ?? "재정 정보를 불러오지 못했습니다.");
      setFinanceLoading(false);
      return;
    }

    setFinanceData(result.data);
    setFinanceLoading(false);
  }, [clubId, hasFinanceWidget]);

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
    const result = await getClubScheduleVoteSummary(clubId);
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

  const loadDecisionData = useCallback(async () => {
    if (!hasDecisionWidget) return;
    setDecisionLoading(true);
    setDecisionError(null);
    const result = await getClubDecisionLog(clubId);
    if (!result.ok || !result.data) {
      setDecisionData(null);
      setDecisionError(result.message ?? "회의록·결정을 불러오지 못했습니다.");
      setDecisionLoading(false);
      return;
    }
    setDecisionData(result.data);
    setDecisionLoading(false);
  }, [clubId, hasDecisionWidget]);

  const persistEditorWidgets = useCallback(
    async (nextWidgets: ClubDashboardWidgetSummary[], successMessage: string) => {
      if (!club?.admin) {
        return;
      }

      setIsSaving(true);
      clearToast();
      const result = await saveWidgetsMutation.mutateAsync(nextWidgets);
      setIsSaving(false);

      if (!result.ok || !result.data) {
        showToast(result.message ?? "위젯 저장에 실패했습니다.", "error");
        return;
      }

      setEditorWidgets(cloneWidgets(result.data.widgets));
      setSavedEditorWidgets(cloneWidgets(result.data.widgets));
      void invalidateClubQueries(queryClient, clubId);
      showToast(successMessage, "success");
      window.dispatchEvent(new Event("semo:dashboard-widgets-updated"));
    },
    [clearToast, club?.admin, clubId, queryClient, saveWidgetsMutation, showToast],
  );

  const handleRemoveWidget = (widgetKey: string) => {
    if (!club?.admin || isSaving) {
      return;
    }

    startTransition(() => {
      setEditorWidgets(
        normalizeSortOrder(
          editorWidgets.map((widget) =>
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
      setEditorWidgets(
        normalizeSortOrder(
          editorWidgets.map((widget) =>
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
        setEditorWidgets(reorderEnabledWidgets(editorWidgets, sourceWidgetKey, targetWidgetKey));
      });
    },
    [club?.admin, editorWidgets, isSaving],
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
    if (!hasFinanceWidget) {
      return;
    }
    const timerId = window.setTimeout(() => {
      void loadFinanceData();
    }, 0);
    return () => {
      window.clearTimeout(timerId);
    };
  }, [hasFinanceWidget, loadFinanceData]);

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

  useEffect(() => {
    if (!hasDecisionWidget) return;
    const timerId = window.setTimeout(() => { void loadDecisionData(); }, 0);
    return () => window.clearTimeout(timerId);
  }, [hasDecisionWidget, loadDecisionData]);

  if (isLoading && !club && !error) {
    return <ClubDashboardLoadingShell />;
  }

  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative flex min-h-full w-full flex-col">
        <ClubPageHeader
          title={club?.name ?? "모임 홈"}
          subtitle="클럽 홈"
          icon="home"
          containerClassName="semo-page-dashboard"
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
                aria-pressed={editMode}
                className="rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/20"
              >
                {editMode ? "편집 완료" : "홈 편집"}
              </button>
            ) : null
          }
        />

        <main className="semo-page-dashboard semo-nav-bottom-space flex-1 space-y-6 p-4 md:p-6">
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
                      관리자
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
                      {editMode ? "위젯 편집 중" : "홈 위젯"}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </motion.section>

          {club ? (
            <motion.div {...staggeredFadeUpMotion(2, reduceMotion)}>
              <ClubGrowthCorePanel growthCore={club.growthCore} />
            </motion.div>
          ) : null}

          <motion.section {...staggeredFadeUpMotion(3, reduceMotion)}>
            {dashboardLoading ? (
              <ClubDashboardWidgetGridShell />
            ) : dashboardError ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                {dashboardError}
              </div>
            ) : club?.admin && editMode ? (
              <ClubDashboardWidgetEditor
                clubId={clubId}
                enabledWidgets={enabledEditorWidgets}
                addableWidgets={addableWidgets}
                blockedWidgets={blockedWidgets}
                activeWidget={activeEditorWidget}
                onDragStart={handleEditorDragStart}
                onDragEnd={handleEditorDragEnd}
                onDragCancel={() => {
                  setActiveEditorWidgetKey(null);
                }}
                onRemoveWidget={handleRemoveWidget}
                onAddWidget={handleAddWidget}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:grid-flow-dense md:auto-rows-[minmax(180px,auto)]">
                {visibleWidgets.map((widget) => (
                  <ClubDashboardWidgetCard
                    key={widget.widgetKey}
                    clubId={clubId}
                    widget={widget}
                    editMode={false}
                    isAdmin={Boolean(club?.admin)}
                    isDragging={false}
                    isDropTarget={false}
                    isDisabled={isSaving}
                    reduceMotion={reduceMotion}
                    attendanceData={isAttendanceWidgetKey(widget.widgetKey) ? attendanceData : null}
                    attendanceLoading={isAttendanceWidgetKey(widget.widgetKey) && attendanceLoading}
                    attendanceError={isAttendanceWidgetKey(widget.widgetKey) ? attendanceError : null}
                    financeData={isFinanceWidgetKey(widget.widgetKey) ? financeData : null}
                    financeLoading={isFinanceWidgetKey(widget.widgetKey) && financeLoading}
                    financeError={isFinanceWidgetKey(widget.widgetKey) ? financeError : null}
                    boardData={isBoardWidgetKey(widget.widgetKey) ? boardData : null}
                    boardLoading={isBoardWidgetKey(widget.widgetKey) && boardLoading}
                    boardError={isBoardWidgetKey(widget.widgetKey) ? boardError : null}
                    scheduleData={isScheduleWidgetKey(widget.widgetKey) ? scheduleData : null}
                    scheduleLoading={isScheduleWidgetKey(widget.widgetKey) && scheduleLoading}
                    scheduleError={isScheduleWidgetKey(widget.widgetKey) ? scheduleError : null}
                    pollData={isPollWidgetKey(widget.widgetKey) ? pollData : null}
                    pollLoading={isPollWidgetKey(widget.widgetKey) && pollLoading}
                    pollError={isPollWidgetKey(widget.widgetKey) ? pollError : null}
                    tournamentData={isTournamentWidgetKey(widget.widgetKey) ? tournamentData : null}
                    tournamentLoading={isTournamentWidgetKey(widget.widgetKey) && tournamentLoading}
                    tournamentError={isTournamentWidgetKey(widget.widgetKey) ? tournamentError : null}
                    bracketData={isBracketWidgetKey(widget.widgetKey) ? bracketData : null}
                    bracketLoading={isBracketWidgetKey(widget.widgetKey) && bracketLoading}
                    bracketError={isBracketWidgetKey(widget.widgetKey) ? bracketError : null}
                    decisionData={isDecisionWidgetKey(widget.widgetKey) ? decisionData : null}
                    decisionLoading={isDecisionWidgetKey(widget.widgetKey) && decisionLoading}
                    decisionError={isDecisionWidgetKey(widget.widgetKey) ? decisionError : null}
                    onRemove={() => {}}
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
            <div className="semo-page-dashboard pointer-events-auto">
              <div className="grid grid-cols-[auto_1fr] gap-2">
                <button
                  type="button"
                  onClick={handleResetEditor}
                  disabled={isSaving}
                  aria-label="위젯 편집 초안 되돌리기"
                  title="위젯 편집 초안 되돌리기"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">restart_alt</span>
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveEditor()}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] py-4 text-base font-bold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-[0_18px_36px_rgba(19,91,236,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {isSaving ? "progress_activity" : "save"}
                  </span>
                  {isSaving ? "저장 중..." : "변경사항 저장"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {club?.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
      </div>
    </div>
  );
}
