import type { TodoSummary } from "@/app/lib/clubs";

export type StatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
export type AssignmentFilter = "ALL" | "ASSIGNED" | "UNASSIGNED" | "OPEN_SUPPORT" | "DIRECT_ASSIGN";
export type ApplicationFilter = "ALL" | "APPLIED" | "SELECTED" | "REJECTED" | "WITHDRAWN";
export type TodoType = "VOLUNTEER" | "OPERATIONS";
export type AssignmentMode = "DIRECT_ASSIGN" | "OPEN_SUPPORT";
export type TodoEditorModalState =
  | { mode: "create" }
  | { mode: "edit"; todoItemId: number; original: TodoSummary };

export const STATUS_OPTIONS: StatusFilter[] = ["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "OVERDUE"];
export const ASSIGNMENT_OPTIONS: AssignmentFilter[] = [
  "ALL",
  "ASSIGNED",
  "UNASSIGNED",
  "OPEN_SUPPORT",
  "DIRECT_ASSIGN",
];
export const APPLICATION_OPTIONS: ApplicationFilter[] = ["ALL", "APPLIED", "SELECTED", "REJECTED", "WITHDRAWN"];

export const TODO_TYPE_OPTIONS = [
  {
    value: "OPERATIONS",
    label: "운영",
    description: "정리, 안내, 운영 체크리스트",
    icon: "dashboard_customize",
  },
  {
    value: "VOLUNTEER",
    label: "봉사",
    description: "지원자 모집 중심의 현장 업무",
    icon: "front_hand",
  },
] as const satisfies ReadonlyArray<{
  value: TodoType;
  label: string;
  description: string;
  icon: string;
}>;

export const ASSIGNMENT_MODE_OPTIONS = [
  {
    value: "DIRECT_ASSIGN",
    label: "직접 배정",
    description: "바로 담당자를 지정해 시작합니다.",
    icon: "person_add",
  },
  {
    value: "OPEN_SUPPORT",
    label: "신청 모집",
    description: "후보를 받은 뒤 운영진이 선정합니다.",
    icon: "group_add",
  },
] as const satisfies ReadonlyArray<{
  value: AssignmentMode;
  label: string;
  description: string;
  icon: string;
}>;

export function combineDateTimeValue(dateValue: string, timeValue: string) {
  if (!dateValue) {
    return null;
  }
  return `${dateValue}T${timeValue || "23:59"}:00`;
}

export function splitDateTimeValue(value: string | null) {
  if (!value) {
    return { date: "", time: "" };
  }
  const [datePart, timePart] = value.split("T");
  return {
    date: datePart ?? "",
    time: timePart ? timePart.slice(0, 5) : "",
  };
}

export function normalizeTodoType(todoType: string): TodoType {
  return todoType === "VOLUNTEER" ? "VOLUNTEER" : "OPERATIONS";
}

export function normalizeAssignmentMode(assignmentMode: string): AssignmentMode {
  return assignmentMode === "OPEN_SUPPORT" ? "OPEN_SUPPORT" : "DIRECT_ASSIGN";
}

export function resolveErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallbackMessage;
}

export function getStatusUpdateMessages(nextStatus: string) {
  switch (nextStatus) {
    case "OPEN":
      return {
        success: "업무를 열림 상태로 되돌렸습니다.",
        failure: "업무를 열림 상태로 되돌리지 못했습니다.",
        refreshFailure: "업무 상태는 바뀌었지만 목록을 다시 불러오지 못했습니다.",
      };
    case "REOPEN":
      return {
        success: "업무를 다시 열었습니다.",
        failure: "업무를 다시 열지 못했습니다.",
        refreshFailure: "업무는 다시 열렸지만 목록을 다시 불러오지 못했습니다.",
      };
    case "IN_PROGRESS":
      return {
        success: "업무를 진행중으로 변경했습니다.",
        failure: "업무를 진행중으로 바꾸지 못했습니다.",
        refreshFailure: "업무 상태는 바뀌었지만 목록을 다시 불러오지 못했습니다.",
      };
    case "COMPLETED":
      return {
        success: "업무를 완료 상태로 변경했습니다.",
        failure: "업무를 완료 상태로 바꾸지 못했습니다.",
        refreshFailure: "업무 상태는 바뀌었지만 목록을 다시 불러오지 못했습니다.",
      };
    case "CANCELED":
      return {
        success: "업무를 취소 상태로 변경했습니다.",
        failure: "업무를 취소 상태로 바꾸지 못했습니다.",
        refreshFailure: "업무 상태는 바뀌었지만 목록을 다시 불러오지 못했습니다.",
      };
    default:
      return {
        success: "상태를 변경했습니다.",
        failure: "상태를 변경하지 못했습니다.",
        refreshFailure: "상태는 변경했지만 목록을 다시 불러오지 못했습니다.",
      };
  }
}

export function getStatusFilterLabel(value: StatusFilter) {
  switch (value) {
    case "OPEN":
      return "열림";
    case "IN_PROGRESS":
      return "진행중";
    case "COMPLETED":
      return "완료";
    case "OVERDUE":
      return "지연";
    default:
      return "상태 전체";
  }
}

export function getAssignmentFilterLabel(value: AssignmentFilter) {
  switch (value) {
    case "ASSIGNED":
      return "배정됨";
    case "UNASSIGNED":
      return "미배정";
    case "OPEN_SUPPORT":
      return "신청 모집";
    case "DIRECT_ASSIGN":
      return "직접 배정";
    default:
      return "배정 전체";
  }
}

export function getApplicationFilterLabel(value: ApplicationFilter) {
  switch (value) {
    case "APPLIED":
      return "신청 대기";
    case "SELECTED":
      return "선정";
    case "REJECTED":
      return "반려";
    case "WITHDRAWN":
      return "취소";
    default:
      return "신청 전체";
  }
}
