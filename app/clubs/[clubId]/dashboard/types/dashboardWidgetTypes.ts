import type {
  ClubScheduleAttendanceSummaryResponse,
  ClubBoardResponse,
  ClubBracketHomeResponse,
  ClubDashboardWidgetSummary,
  ClubFinanceHomeResponse,
  ClubScheduleVoteSummaryResponse,
  ClubScheduleResponse,
  ClubTournamentHomeResponse,
} from "@/app/lib/clubs";
import type { ClubDecisionLog } from "@/app/lib/semo/decision";

export type ClubDashboardWidgetCardProps = {
  clubId: string;
  widget: ClubDashboardWidgetSummary;
  editMode: boolean;
  isAdmin: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  isDisabled: boolean;
  reduceMotion: boolean;
  attendanceData: ClubScheduleAttendanceSummaryResponse | null;
  attendanceLoading: boolean;
  attendanceError: string | null;
  financeData: ClubFinanceHomeResponse | null;
  financeLoading: boolean;
  financeError: string | null;
  boardData: ClubBoardResponse | null;
  boardLoading: boolean;
  boardError: string | null;
  scheduleData: ClubScheduleResponse | null;
  scheduleLoading: boolean;
  scheduleError: string | null;
  pollData: ClubScheduleVoteSummaryResponse | null;
  pollLoading: boolean;
  pollError: string | null;
  tournamentData: ClubTournamentHomeResponse | null;
  tournamentLoading: boolean;
  tournamentError: string | null;
  bracketData: ClubBracketHomeResponse | null;
  bracketLoading: boolean;
  bracketError: string | null;
  decisionData: ClubDecisionLog | null;
  decisionLoading: boolean;
  decisionError: string | null;
  onRemove: (widgetKey: string) => void;
  onDragStart: (widgetKey: string) => void;
  onDragOver: (widgetKey: string) => void;
  onDrop: (widgetKey: string) => void;
  onDragEnd: () => void;
  onTouchDragStart: (widgetKey: string) => void;
};
