import type {
  ClubAttendanceResponse,
  ClubBoardResponse,
  ClubBracketHomeResponse,
  ClubDashboardWidgetSummary,
  ClubFinanceHomeResponse,
  ClubScheduleVoteSummaryResponse,
  ClubScheduleResponse,
  ClubTournamentHomeResponse,
} from "@/app/lib/clubs";

export type ClubDashboardWidgetCardProps = {
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
  attendancePulseToken: number;
  isCheckingInAttendance: boolean;
  onRemove: (widgetKey: string) => void;
  onAttendanceCheckIn: () => void;
  onDragStart: (widgetKey: string) => void;
  onDragOver: (widgetKey: string) => void;
  onDrop: (widgetKey: string) => void;
  onDragEnd: () => void;
  onTouchDragStart: (widgetKey: string) => void;
};
