"use client";

import { Public_Sans } from "next/font/google";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { CSSProperties } from "react";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { DatePopoverField } from "@/app/components/DatePopoverField";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { RouteModal } from "@/app/components/RouteModal";
import { TimePopoverField } from "@/app/components/TimePopoverField";
import { TodoApplicationManagerModal } from "@/app/components/TodoApplicationManagerModal";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import {
  createClubTodo,
  deleteClubTodo,
  getClubAdminTodoApplications,
  getClubAdminTodos,
  reviewClubTodoApplication,
  updateClubTodo,
  updateClubTodoStatus,
  type ClubAdminTodoResponse,
  type TodoItemApplicationsResponse,
  type TodoSummary,
} from "@/app/lib/clubs";
import { FAB_RIGHT_OFFSET_CLASS_NAME, getActionFabBottomClass } from "@/app/lib/fab";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ClubAdminTodoClientProps = {
  clubId: string;
  initialData: ClubAdminTodoResponse;
};

type StatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
type AssignmentFilter = "ALL" | "ASSIGNED" | "UNASSIGNED" | "OPEN_SUPPORT" | "DIRECT_ASSIGN";
type ApplicationFilter = "ALL" | "APPLIED" | "SELECTED" | "REJECTED" | "WITHDRAWN";
type TodoType = "VOLUNTEER" | "OPERATIONS";
type AssignmentMode = "DIRECT_ASSIGN" | "OPEN_SUPPORT";
type TodoEditorModalState =
  | { mode: "create" }
  | { mode: "edit"; todoItemId: number; original: TodoSummary };

type TodoTypeOption = {
  value: TodoType;
  label: string;
  description: string;
  icon: string;
};

type AssignmentModeOption = {
  value: AssignmentMode;
  label: string;
  description: string;
  icon: string;
};

const STATUS_OPTIONS: StatusFilter[] = ["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "OVERDUE"];
const ASSIGNMENT_OPTIONS: AssignmentFilter[] = [
  "ALL",
  "ASSIGNED",
  "UNASSIGNED",
  "OPEN_SUPPORT",
  "DIRECT_ASSIGN",
];
const APPLICATION_OPTIONS: ApplicationFilter[] = ["ALL", "APPLIED", "SELECTED", "REJECTED", "WITHDRAWN"];
const TODO_TYPE_OPTIONS: TodoTypeOption[] = [
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
];
const ASSIGNMENT_MODE_OPTIONS: AssignmentModeOption[] = [
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
];

function combineDateTimeValue(dateValue: string, timeValue: string) {
  if (!dateValue) {
    return null;
  }
  return `${dateValue}T${timeValue || "23:59"}:00`;
}

function splitDateTimeValue(value: string | null) {
  if (!value) {
    return { date: "", time: "" };
  }
  const [datePart, timePart] = value.split("T");
  return {
    date: datePart ?? "",
    time: timePart ? timePart.slice(0, 5) : "",
  };
}

function normalizeTodoType(todoType: string): TodoType {
  return todoType === "VOLUNTEER" ? "VOLUNTEER" : "OPERATIONS";
}

function normalizeAssignmentMode(assignmentMode: string): AssignmentMode {
  return assignmentMode === "OPEN_SUPPORT" ? "OPEN_SUPPORT" : "DIRECT_ASSIGN";
}

function resolveErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallbackMessage;
}

function getStatusUpdateMessages(nextStatus: string) {
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

function getStatusFilterLabel(value: StatusFilter) {
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

function getAssignmentFilterLabel(value: AssignmentFilter) {
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

function getApplicationFilterLabel(value: ApplicationFilter) {
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

export function ClubAdminTodoClient({ clubId, initialData }: ClubAdminTodoClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [todoData, setTodoData] = useState(initialData);
  const canCreate = todoData.canCreate;
  const canAssign = todoData.canAssign;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("ALL");
  const [applicationFilter, setApplicationFilter] = useState<ApplicationFilter>("ALL");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterDraftStatus, setFilterDraftStatus] = useState<StatusFilter>("ALL");
  const [filterDraftAssignment, setFilterDraftAssignment] = useState<AssignmentFilter>("ALL");
  const [filterDraftApplication, setFilterDraftApplication] = useState<ApplicationFilter>("ALL");
  const [pendingTodoId, setPendingTodoId] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [todoType, setTodoType] = useState<TodoType>("OPERATIONS");
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>(
    initialData.canAssign ? "DIRECT_ASSIGN" : "OPEN_SUPPORT",
  );
  const [assignedClubProfileId, setAssignedClubProfileId] = useState("");
  const [dueAtDate, setDueAtDate] = useState("");
  const [dueAtTime, setDueAtTime] = useState("");
  const [editorModal, setEditorModal] = useState<TodoEditorModalState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationModalItem, setApplicationModalItem] = useState<TodoSummary | null>(null);
  const [applicationModalData, setApplicationModalData] = useState<TodoItemApplicationsResponse | null>(null);
  const [isApplicationModalLoading, setIsApplicationModalLoading] = useState(false);
  const [reviewingApplicationId, setReviewingApplicationId] = useState<number | null>(null);
  const [deletingTodoItem, setDeletingTodoItem] = useState<TodoSummary | null>(null);
  const { toast, showToast, clearToast } = useEphemeralToast();

  const editingItem = editorModal?.mode === "edit" ? editorModal.original : null;
  const assignedMember = todoData.availableMembers.find(
    (member) => String(member.clubProfileId) === assignedClubProfileId,
  );
  const inactiveAssignedOption =
    editingItem &&
    editingItem.assignedClubProfileId != null &&
    !assignedMember
      ? {
          clubProfileId: editingItem.assignedClubProfileId,
          label: `${editingItem.assignedDisplayName ?? "기존 담당자"} · 현재 비활성`,
        }
      : null;

  const reloadTodos = async (
    nextStatusFilter = statusFilter,
    nextAssignmentFilter = assignmentFilter,
    nextApplicationFilter = applicationFilter,
    { showErrorToast = true }: { showErrorToast?: boolean } = {},
  ) => {
    try {
      const result = await getClubAdminTodos(clubId, {
        statusFilter: nextStatusFilter,
        assignmentFilter: nextAssignmentFilter,
        applicationFilter: nextApplicationFilter,
      });
      if (!result.ok || !result.data) {
        if (showErrorToast) {
          showToast(result.message ?? "할 일 운영 정보를 다시 불러오지 못했습니다.", "error");
        }
        return false;
      }
      setTodoData(result.data);
      return true;
    } catch (error) {
      if (showErrorToast) {
        showToast(resolveErrorMessage(error, "할 일 운영 정보를 다시 불러오지 못했습니다."), "error");
      }
      return false;
    }
  };

  const resetFormDraft = () => {
    setTitle("");
    setDescription("");
    setTodoType("OPERATIONS");
    setAssignmentMode(canAssign ? "DIRECT_ASSIGN" : "OPEN_SUPPORT");
    setAssignedClubProfileId("");
    setDueAtDate("");
    setDueAtTime("");
  };

  const closeEditorModal = ({ force = false }: { force?: boolean } = {}) => {
    if (!force && isSubmitting) {
      return;
    }
    resetFormDraft();
    setEditorModal(null);
  };

  const openCreateModal = () => {
    if (!canCreate) {
      return;
    }
    resetFormDraft();
    setEditorModal({ mode: "create" });
  };

  const openEditModal = (item: TodoSummary) => {
    const dueAt = splitDateTimeValue(item.dueAt);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setTodoType(normalizeTodoType(item.todoType));
    setAssignmentMode(normalizeAssignmentMode(item.assignmentMode));
    setAssignedClubProfileId(item.assignedClubProfileId != null ? String(item.assignedClubProfileId) : "");
    setDueAtDate(dueAt.date);
    setDueAtTime(dueAt.time);
    setEditorModal({ mode: "edit", todoItemId: item.todoItemId, original: item });
  };

  const handleFilterChange = async (
    nextStatusFilter: StatusFilter,
    nextAssignmentFilter: AssignmentFilter,
    nextApplicationFilter: ApplicationFilter,
  ) => {
    const previousStatusFilter = statusFilter;
    const previousAssignmentFilter = assignmentFilter;
    const previousApplicationFilter = applicationFilter;
    setStatusFilter(nextStatusFilter);
    setAssignmentFilter(nextAssignmentFilter);
    setApplicationFilter(nextApplicationFilter);
    clearToast();
    const reloaded = await reloadTodos(nextStatusFilter, nextAssignmentFilter, nextApplicationFilter);
    if (!reloaded) {
      setStatusFilter(previousStatusFilter);
      setAssignmentFilter(previousAssignmentFilter);
      setApplicationFilter(previousApplicationFilter);
    }
  };

  const openFilterModal = () => {
    setFilterDraftStatus(statusFilter);
    setFilterDraftAssignment(assignmentFilter);
    setFilterDraftApplication(applicationFilter);
    setFilterModalOpen(true);
  };

  const closeFilterModal = () => {
    setFilterModalOpen(false);
  };

  const applyFilters = async () => {
    const nextStatus = filterDraftStatus;
    const nextAssignment = filterDraftAssignment;
    const nextApplication = filterDraftApplication;
    setFilterModalOpen(false);
    await handleFilterChange(nextStatus, nextAssignment, nextApplication);
  };

  const handleSubmit = async () => {
    if (!editorModal) {
      return;
    }
    if (editorModal.mode === "create" && !canCreate) {
      showToast("할 일을 등록할 권한이 없습니다.", "error");
      return;
    }

    setIsSubmitting(true);
    clearToast();

    const base = editorModal.mode === "edit" ? editorModal.original : null;
    const isEditMode = editorModal.mode === "edit";
    const nextAssignmentMode = canAssign
      ? assignmentMode
      : base
        ? normalizeAssignmentMode(base.assignmentMode)
        : "OPEN_SUPPORT";
    const request = {
      title: canCreate ? title.trim() : base?.title ?? "",
      description: canCreate ? description.trim() || null : base?.description ?? null,
      todoType: canCreate ? todoType : normalizeTodoType(base?.todoType ?? "OPERATIONS"),
      assignmentMode: nextAssignmentMode,
      assignedClubProfileId: canAssign
        ? nextAssignmentMode === "DIRECT_ASSIGN" && assignedClubProfileId
          ? Number(assignedClubProfileId)
          : null
        : base?.assignedClubProfileId ?? null,
      dueAt: canCreate ? combineDateTimeValue(dueAtDate, dueAtTime) : base?.dueAt ?? null,
    };

    try {
      const result = isEditMode
        ? await updateClubTodo(clubId, editorModal.todoItemId, request)
        : await createClubTodo(clubId, request);

      if (!result.ok || !result.data) {
        showToast(result.message ?? "할 일을 저장하지 못했습니다.", "error");
        return;
      }

      const reloaded = await reloadTodos(undefined, undefined, undefined, { showErrorToast: false });
      closeEditorModal({ force: true });
      if (!reloaded) {
        showToast(
          isEditMode
            ? "할 일은 수정했지만 목록을 다시 불러오지 못했습니다."
            : "할 일은 등록했지만 목록을 다시 불러오지 못했습니다.",
          "error",
        );
        return;
      }

      showToast(isEditMode ? "할 일을 수정했습니다." : "할 일을 등록했습니다.", "success");
    } catch (error) {
      showToast(
        resolveErrorMessage(error, isEditMode ? "할 일을 수정하지 못했습니다." : "할 일을 등록하지 못했습니다."),
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (todoItemId: number, nextStatus: string) => {
    setPendingTodoId(todoItemId);
    clearToast();
    const messages = getStatusUpdateMessages(nextStatus);

    try {
      const result = await updateClubTodoStatus(clubId, todoItemId, { statusCode: nextStatus });

      if (!result.ok || !result.data) {
        showToast(result.message ?? messages.failure, "error");
        return;
      }

      const reloaded = await reloadTodos(undefined, undefined, undefined, { showErrorToast: false });
      if (!reloaded) {
        showToast(messages.refreshFailure, "error");
        return;
      }

      showToast(messages.success, "success");
    } catch (error) {
      showToast(resolveErrorMessage(error, messages.failure), "error");
    } finally {
      setPendingTodoId(null);
    }
  };

  const handleLoadMore = async () => {
    if (!todoData.hasNext || todoData.nextCursorTodoItemId == null) {
      return;
    }
    setIsLoadingMore(true);
    try {
      const result = await getClubAdminTodos(clubId, {
        statusFilter,
        assignmentFilter,
        applicationFilter,
        cursorTodoItemId: todoData.nextCursorTodoItemId,
      });

      if (!result.ok || !result.data) {
        showToast(result.message ?? "목록을 더 불러오지 못했습니다.", "error");
        return;
      }
      const nextData = result.data;

      setTodoData((current) => ({
        ...nextData,
        items: [...current.items, ...nextData.items],
      }));
    } catch (error) {
      showToast(resolveErrorMessage(error, "목록을 더 불러오지 못했습니다."), "error");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadApplicationModal = async (item: TodoSummary) => {
    setApplicationModalItem(item);
    setApplicationModalData(null);
    setIsApplicationModalLoading(true);
    clearToast();

    try {
      const result = await getClubAdminTodoApplications(clubId, item.todoItemId);
      if (!result.ok || !result.data) {
        showToast(result.message ?? "업무 신청 목록을 불러오지 못했습니다.", "error");
        setApplicationModalItem(null);
        return;
      }
      setApplicationModalData(result.data);
    } catch (error) {
      showToast(resolveErrorMessage(error, "업무 신청 목록을 불러오지 못했습니다."), "error");
      setApplicationModalItem(null);
    } finally {
      setIsApplicationModalLoading(false);
    }
  };

  const closeApplicationModal = () => {
    if (reviewingApplicationId != null) {
      return;
    }
    setApplicationModalItem(null);
    setApplicationModalData(null);
  };

  const handleReviewApplication = async (
    application: NonNullable<TodoItemApplicationsResponse["applications"]>[number],
    nextStatus: "SELECTED" | "REJECTED",
  ) => {
    if (!applicationModalItem) {
      return;
    }
    setReviewingApplicationId(application.todoItemApplicationId);
    clearToast();

    try {
      const result = await reviewClubTodoApplication(
        clubId,
        applicationModalItem.todoItemId,
        application.todoItemApplicationId,
        { applicationStatus: nextStatus },
      );
      if (!result.ok || !result.data) {
        showToast(result.message ?? "신청 검토에 실패했습니다.", "error");
        return;
      }

      const [reloadedTodos, reloadedApplications] = await Promise.all([
        reloadTodos(undefined, undefined, undefined, { showErrorToast: false }),
        getClubAdminTodoApplications(clubId, applicationModalItem.todoItemId),
      ]);

      if (reloadedApplications.ok && reloadedApplications.data) {
        setApplicationModalData(reloadedApplications.data);
      }

      if (!reloadedTodos) {
        showToast("신청은 처리했지만 목록을 다시 불러오지 못했습니다.", "error");
        return;
      }

      showToast(nextStatus === "SELECTED" ? "신청자를 선정했습니다." : "신청을 반려했습니다.", "success");
    } catch (error) {
      showToast(resolveErrorMessage(error, "신청 검토에 실패했습니다."), "error");
    } finally {
      setReviewingApplicationId(null);
    }
  };

  const handleDeleteTodo = async () => {
    if (!deletingTodoItem) {
      return;
    }
    setPendingTodoId(deletingTodoItem.todoItemId);
    clearToast();

    try {
      const result = await deleteClubTodo(clubId, deletingTodoItem.todoItemId);
      if (!result.ok) {
        showToast(result.message ?? "할 일을 삭제하지 못했습니다.", "error");
        return;
      }
      setDeletingTodoItem(null);

      const reloaded = await reloadTodos(undefined, undefined, undefined, { showErrorToast: false });
      if (!reloaded) {
        showToast("할 일은 삭제했지만 목록을 다시 불러오지 못했습니다.", "error");
        return;
      }

      showToast("할 일을 삭제했습니다.", "success");
    } catch (error) {
      showToast(resolveErrorMessage(error, "할 일을 삭제하지 못했습니다."), "error");
    } finally {
      setPendingTodoId(null);
    }
  };

  return (
    <div
      className={`${publicSans.className} min-h-screen bg-[#f8f6f6] text-slate-900`}
      style={
        {
          "--primary": "#ec5b13",
          "--background-light": "#f8f6f6",
        } as CSSProperties
      }
    >
      <div className="min-h-screen bg-[#f8f6f6]">
        <ClubPageHeader
          title="할 일 관리"
          subtitle={todoData.clubName}
          icon="assignment"
          theme="admin"
          containerClassName="max-w-md"
        />

        <main className="semo-nav-bottom-space mx-auto w-full max-w-md space-y-4 px-4 pt-4">
          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Ops Snapshot
            </p>
            <h2 className="mt-3 text-xl font-bold">
              누가 어떤 업무를 맡았는지, 아직 안 끝난 건 무엇인지 운영 관점에서 바로 확인합니다.
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryCard label="열림" value={todoData.openCount} />
              <SummaryCard label="진행중" value={todoData.inProgressCount} />
              <SummaryCard label="완료" value={todoData.completedCount} />
              <SummaryCard label="신청 대기" value={todoData.pendingApplicationCount} />
            </div>
            <div className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-slate-600">
              활성 멤버 {todoData.activeMemberCount}명 기준으로 신청을 받고, 선발 후 배정 상태를 운영합니다.
            </div>
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">운영 필터</h3>
              <span className="text-xs font-medium text-slate-400">{todoData.items.length}건</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openFilterModal}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white"
              >
                필터 선택
              </button>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                {getStatusFilterLabel(statusFilter)}
              </span>
              <span className="rounded-full bg-orange-50 px-3 py-2 text-xs font-semibold text-[#b4541a]">
                {getAssignmentFilterLabel(assignmentFilter)}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                {getApplicationFilterLabel(applicationFilter)}
              </span>
            </div>
          </motion.section>

          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">업무 목록</h3>
              <span className="text-xs font-medium text-slate-400">
                {todoData.hasNext ? "계속 있음" : "마지막 페이지"}
              </span>
            </div>
            <div className="space-y-3">
              {todoData.items.length === 0 ? (
                <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  현재 조건에 맞는 업무가 없습니다.
                </div>
              ) : (
                todoData.items.map((item, index) => {
                  const isTerminal = item.statusCode === "COMPLETED" || item.statusCode === "CANCELED";
                  const canOpenEditor = item.canEdit && !isTerminal;
                  const canOpenAssignEditor = !item.canEdit && todoData.canAssign && !isTerminal;
                  const canMarkInProgress = item.statusCode === "OPEN" && item.assignedClubProfileId != null;
                  const canMarkCompleted =
                    item.statusCode === "IN_PROGRESS" ||
                    (item.statusCode === "OPEN" &&
                      item.assignedClubProfileId != null &&
                      item.assignmentMode === "DIRECT_ASSIGN");
                  const canResetToOpen = item.statusCode === "IN_PROGRESS";
                  const canReopen = isTerminal;
                  const canCancel = item.statusCode === "OPEN" || item.statusCode === "IN_PROGRESS";
                  const resetToOpenLabel =
                    item.assignmentMode === "OPEN_SUPPORT" ? "모집으로 되돌리기" : "대기로 되돌리기";

                  return <motion.article
                    key={item.todoItemId}
                    className={`rounded-2xl border p-4 ${
                      item.overdue
                        ? "border-rose-200 bg-rose-50/40"
                        : item.statusCode === "IN_PROGRESS"
                          ? "border-amber-200 bg-amber-50/40"
                          : item.statusCode === "COMPLETED"
                            ? "border-emerald-200 bg-emerald-50/25"
                            : "border-slate-200 bg-white"
                    }`}
                    {...staggeredFadeUpMotion(index + 3, reduceMotion)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={item.todoType === "VOLUNTEER" ? "sky" : "slate"} label={item.todoTypeLabel} />
                      <Badge
                        tone={item.assignmentMode === "OPEN_SUPPORT" ? "amber" : "blue"}
                        label={item.assignmentModeLabel}
                      />
                      <Badge
                        tone={item.statusCode === "COMPLETED" ? "emerald" : item.overdue ? "rose" : "slate"}
                        label={item.overdue ? "지연" : item.statusLabel}
                      />
                    </div>
                    <p className="mt-3 text-base font-bold text-slate-900">{item.title}</p>
                    {item.description ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    ) : null}
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                      <InfoItem label="담당자" value={item.assignedDisplayName ?? "미배정"} />
                      <InfoItem label="마감일" value={item.dueAtLabel ?? "미정"} />
                      <InfoItem label="등록자" value={item.createdByDisplayName ?? "미정"} />
                      <InfoItem label="신청 수" value={`${item.applicationCount}건`} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {canOpenEditor ? (
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                        >
                          수정
                        </button>
                      ) : null}
                      {canOpenAssignEditor ? (
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                        >
                          배정
                        </button>
                      ) : null}
                      {item.canReviewApplications ? (
                        <button
                          type="button"
                          onClick={() => void loadApplicationModal(item)}
                          className="rounded-full bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 ring-1 ring-amber-200"
                        >
                          신청 관리 {item.applicationCount}
                        </button>
                      ) : null}
                      {todoData.canDelete ? (
                        <button
                          type="button"
                          onClick={() => setDeletingTodoItem(item)}
                          disabled={pendingTodoId === item.todoItemId}
                          className="rounded-full bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 ring-1 ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                        >
                          삭제
                        </button>
                      ) : null}
                      {item.canManageStatus ? (
                        <>
                          {canMarkInProgress ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(item.todoItemId, "IN_PROGRESS")}
                              disabled={pendingTodoId === item.todoItemId}
                              className="rounded-full bg-amber-500 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              진행중
                            </button>
                          ) : null}
                          {canMarkCompleted ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(item.todoItemId, "COMPLETED")}
                              disabled={pendingTodoId === item.todoItemId}
                              className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              완료
                            </button>
                          ) : null}
                          {canResetToOpen ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(item.todoItemId, "OPEN")}
                              disabled={pendingTodoId === item.todoItemId}
                              className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              {resetToOpenLabel}
                            </button>
                          ) : null}
                          {canReopen ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(item.todoItemId, "REOPEN")}
                              disabled={pendingTodoId === item.todoItemId}
                              className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              다시 열기
                            </button>
                          ) : null}
                          {canCancel ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(item.todoItemId, "CANCELED")}
                              disabled={pendingTodoId === item.todoItemId}
                              className="rounded-full bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              취소
                            </button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </motion.article>;
                })
              )}
            </div>

            {todoData.hasNext ? (
              <button
                type="button"
                onClick={() => void handleLoadMore()}
                disabled={isLoadingMore}
                className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {isLoadingMore ? "불러오는 중..." : "더 보기"}
              </button>
            ) : null}
          </motion.section>
        </main>

        {canCreate ? (
          <button
            type="button"
            aria-label="할 일 등록"
            onClick={openCreateModal}
            className={`fixed ${FAB_RIGHT_OFFSET_CLASS_NAME} ${getActionFabBottomClass(true)} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#ec5b13] text-white transition-transform active:scale-95`}
            style={{ boxShadow: "0 6px 16px rgba(236, 91, 19, 0.32)" }}
          >
            <span className="material-symbols-outlined text-[28px]">assignment_add</span>
          </button>
        ) : null}

        <EphemeralToast toastId={toast?.id ?? null} message={toast?.message ?? null} tone={toast?.tone} />

        {deletingTodoItem ? (
          <ScheduleActionConfirmModal
            title="할 일을 삭제할까요?"
            description="삭제하면 연결된 신청 기록도 함께 지워집니다. 취소 상태와 달리 복구할 수 없습니다."
            confirmLabel="할 일 삭제"
            busyLabel="삭제 중..."
            busy={pendingTodoId === deletingTodoItem.todoItemId}
            onCancel={() => {
              if (pendingTodoId !== deletingTodoItem.todoItemId) {
                setDeletingTodoItem(null);
              }
            }}
            onConfirm={handleDeleteTodo}
          />
        ) : null}

        <AnimatePresence>
          {editorModal ? (
            <RouteModal onDismiss={() => closeEditorModal()} dismissOnBackdrop={false}>
              <section className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {editorModal.mode === "create" ? "Create Todo" : "Edit Todo"}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">
                      {editorModal.mode === "create"
                        ? "새 할 일 등록"
                        : canCreate
                          ? "업무 수정"
                          : "업무 배정"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    aria-label="할 일 편집기 닫기"
                    onClick={() => closeEditorModal()}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-5">
                    <div>
                      <p className="text-sm text-slate-500">
                        {editorModal.mode === "create"
                          ? "운영 업무, 봉사 업무, 마감일과 담당 방식을 정해 바로 등록합니다."
                          : "권한에 따라 기본 정보 또는 담당자 배정을 조정합니다."}
                      </p>
                    </div>

                    <div className="space-y-4 rounded-3xl bg-slate-50 p-4">
                      {canCreate ? (
                        <>
                          <label className="block">
                            <span className="text-sm font-semibold text-slate-700">업무 이름</span>
                            <input
                              value={title}
                              onChange={(event) => setTitle(event.target.value)}
                              placeholder="예: 경기장 세팅, 참가자 안내"
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm font-semibold text-slate-700">업무 설명</span>
                            <textarea
                              value={description}
                              onChange={(event) => setDescription(event.target.value)}
                              rows={4}
                              placeholder="필요한 맥락이나 체크포인트를 적어주세요."
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                            />
                          </label>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <span className="text-sm font-semibold text-slate-700">업무 유형</span>
                              <div className="mt-2 grid gap-2">
                                {TODO_TYPE_OPTIONS.map((option) => (
                                  <SelectableCard
                                    key={option.value}
                                    selected={todoType === option.value}
                                    label={option.label}
                                    description={option.description}
                                    icon={option.icon}
                                    onClick={() => setTodoType(option.value)}
                                  />
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="text-sm font-semibold text-slate-700">마감일</span>
                              <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="mb-3 flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                                  <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                      Deadline
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-700">
                                      {dueAtDate ? `${dueAtDate}${dueAtTime ? ` ${dueAtTime}` : ""}` : "마감일 미정"}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDueAtDate("");
                                      setDueAtTime("");
                                    }}
                                    disabled={!dueAtDate}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                  >
                                    초기화
                                  </button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <label className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 transition focus-within:border-[#ec5b13] focus-within:bg-white">
                                    <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                                      날짜
                                    </span>
                                    <DatePopoverField
                                      value={dueAtDate}
                                      onChange={setDueAtDate}
                                      buttonClassName="w-full border-0 bg-transparent px-0 py-0 text-sm font-semibold text-slate-900 hover:border-transparent focus:border-transparent focus:ring-0"
                                    />
                                  </label>
                                  <label className={`rounded-2xl border px-3 py-3 text-sm transition ${
                                    dueAtDate
                                      ? "border-slate-200 bg-slate-50 text-slate-700 focus-within:border-[#ec5b13] focus-within:bg-white"
                                      : "border-slate-200 bg-slate-100 text-slate-400"
                                  }`}>
                                    <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                                      시간
                                    </span>
                                    <TimePopoverField
                                      value={dueAtTime}
                                      onChange={setDueAtTime}
                                      disabled={!dueAtDate}
                                      buttonClassName={`w-full border-0 bg-transparent px-0 py-0 text-sm font-semibold text-slate-900 hover:border-transparent focus:border-transparent focus:ring-0 disabled:cursor-not-allowed ${
                                        dueAtDate ? "" : "text-slate-400"
                                      }`}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : editingItem ? (
                        <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">{editingItem.title}</p>
                          <p className="mt-2 leading-6">{editingItem.description || "설명 없음"}</p>
                          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                            <InfoItem label="업무 유형" value={editingItem.todoTypeLabel} />
                            <InfoItem label="마감일" value={editingItem.dueAtLabel ?? "미정"} />
                          </div>
                          <p className="mt-4 text-xs text-slate-500">
                            이 권한에서는 기본 정보를 바꾸지 않고 담당자와 배정 방식만 조정합니다.
                          </p>
                        </div>
                      ) : null}

                      {canAssign ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <span className="text-sm font-semibold text-slate-700">배정 방식</span>
                            <div className="mt-2 grid gap-2">
                              {ASSIGNMENT_MODE_OPTIONS.map((option) => (
                                <SelectableCard
                                  key={option.value}
                                  selected={assignmentMode === option.value}
                                  label={option.label}
                                  description={option.description}
                                  icon={option.icon}
                                  onClick={() => {
                                    setAssignmentMode(option.value);
                                    if (option.value === "OPEN_SUPPORT") {
                                      setAssignedClubProfileId("");
                                    }
                                  }}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-sm font-semibold text-slate-700">담당자</span>
                            <div className={`mt-2 rounded-2xl border p-3 ${
                              assignmentMode === "OPEN_SUPPORT"
                                ? "border-slate-200 bg-slate-100"
                                : "border-slate-200 bg-white"
                            }`}>
                              <div className="mb-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                  Assignee
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                  {assignmentMode === "OPEN_SUPPORT"
                                    ? "신청 모집에서는 담당자를 미리 고르지 않습니다."
                                    : assignedMember?.memberDisplayName
                                      ?? editingItem?.assignedDisplayName
                                      ?? inactiveAssignedOption?.label
                                      ?? "담당자를 선택하세요."}
                                </p>
                              </div>
                              {assignmentMode === "OPEN_SUPPORT" ? (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                                  지원자 모집 후 운영진이 선정합니다.
                                </div>
                              ) : (
                                <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                                  {inactiveAssignedOption ? (
                                    <SelectableMemberCard
                                      selected={assignedClubProfileId === String(inactiveAssignedOption.clubProfileId)}
                                      label={inactiveAssignedOption.label}
                                      roleCode="INACTIVE"
                                      onClick={() => setAssignedClubProfileId(String(inactiveAssignedOption.clubProfileId))}
                                    />
                                  ) : null}
                                  {todoData.availableMembers.map((member) => (
                                    <SelectableMemberCard
                                      key={member.clubProfileId}
                                      selected={assignedClubProfileId === String(member.clubProfileId)}
                                      label={member.memberDisplayName}
                                      roleCode={member.memberRoleCode}
                                      onClick={() => setAssignedClubProfileId(String(member.clubProfileId))}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : canCreate ? (
                        <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600">
                          {editorModal.mode === "edit" ? (
                            <>
                              <p className="font-semibold text-slate-900">
                                배정 권한이 없어 현재 배정 상태를 유지한 채 기본 정보만 수정합니다.
                              </p>
                              <p className="mt-2">
                                배정 방식: {assignmentMode === "OPEN_SUPPORT" ? "신청 모집" : "직접 배정"}
                              </p>
                              <p className="mt-1">
                                담당자: {assignedMember?.memberDisplayName ?? editingItem?.assignedDisplayName ?? "미배정"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-slate-900">
                                배정 권한이 없어 새 업무는 신청 모집 상태로 등록됩니다.
                              </p>
                              <p className="mt-2">
                                직접 배정은 배정 권한이 있는 운영자가 나중에 조정할 수 있습니다.
                              </p>
                            </>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => void handleSubmit()}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#ec5b13]/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {isSubmitting
                      ? "저장 중..."
                      : editorModal.mode === "edit"
                        ? canCreate
                          ? "업무 저장"
                          : "배정 저장"
                        : "할 일 등록"}
                  </button>
                </div>
              </section>
            </RouteModal>
          ) : null}
          {filterModalOpen ? (
            <RouteModal onDismiss={closeFilterModal} dismissOnBackdrop={false}>
              <section className="flex min-h-0 flex-1 flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Operations Filter</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-900">운영 필터 선택</h3>
                  </div>
                  <button
                    type="button"
                    aria-label="운영 필터 닫기"
                    onClick={closeFilterModal}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                  <div className="space-y-5">
                    <FilterGroup
                      title="상태"
                      options={STATUS_OPTIONS}
                      value={filterDraftStatus}
                      getLabel={(value) => getStatusFilterLabel(value as StatusFilter)}
                      onChange={(value) => setFilterDraftStatus(value as StatusFilter)}
                    />
                    <FilterGroup
                      title="배정 방식"
                      options={ASSIGNMENT_OPTIONS}
                      value={filterDraftAssignment}
                      getLabel={(value) => getAssignmentFilterLabel(value as AssignmentFilter)}
                      onChange={(value) => setFilterDraftAssignment(value as AssignmentFilter)}
                    />
                    <FilterGroup
                      title="신청 상태"
                      options={APPLICATION_OPTIONS}
                      value={filterDraftApplication}
                      getLabel={(value) => getApplicationFilterLabel(value as ApplicationFilter)}
                      onChange={(value) => setFilterDraftApplication(value as ApplicationFilter)}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 px-5 py-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDraftStatus("ALL");
                        setFilterDraftAssignment("ALL");
                        setFilterDraftApplication("ALL");
                      }}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                    >
                      초기화
                    </button>
                    <button
                      type="button"
                      onClick={() => void applyFilters()}
                      className="flex-1 rounded-2xl bg-[#ec5b13] px-4 py-3 text-sm font-bold text-white"
                    >
                      적용
                    </button>
                  </div>
                </div>
              </section>
            </RouteModal>
          ) : null}
        </AnimatePresence>

        {applicationModalItem ? (
          <TodoApplicationManagerModal
            data={applicationModalData}
            loading={isApplicationModalLoading}
            reviewingApplicationId={reviewingApplicationId}
            onDismiss={closeApplicationModal}
            onReview={handleReviewApplication}
          />
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Badge({
  tone,
  label,
}: {
  tone: "sky" | "slate" | "amber" | "blue" | "emerald" | "rose";
  label: string;
}) {
  const className = {
    sky: "bg-sky-50 text-sky-700",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  }[tone];

  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${className}`}>
      {label}
    </span>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-slate-600">{value}</p>
    </div>
  );
}

function SelectableCard({
  selected,
  label,
  description,
  icon,
  onClick,
}: {
  selected: boolean;
  label: string;
  description: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? "border-[#ec5b13] bg-[#fff4ec] shadow-[0_10px_24px_rgba(236,91,19,0.12)]"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${
        selected ? "bg-[#ec5b13] text-white" : "bg-slate-100 text-slate-500"
      }`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900">{label}</p>
          {selected ? (
            <span className="rounded-full bg-[#ec5b13] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
              선택됨
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </button>
  );
}

function SelectableMemberCard({
  selected,
  label,
  roleCode,
  onClick,
}: {
  selected: boolean;
  label: string;
  roleCode: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        selected
          ? "border-[#ec5b13] bg-[#fff4ec] shadow-[0_10px_24px_rgba(236,91,19,0.12)]"
          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-900">{label}</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{roleCode}</p>
      </div>
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
        selected ? "bg-[#ec5b13] text-white" : "bg-white text-slate-300"
      }`}>
        <span className="material-symbols-outlined text-[18px]">
          {selected ? "check" : "radio_button_unchecked"}
        </span>
      </div>
    </button>
  );
}

function FilterGroup({
  title,
  options,
  value,
  getLabel,
  onChange,
}: {
  title: string;
  options: string[];
  value: string;
  getLabel: (value: string) => string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
              value === option
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {getLabel(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
