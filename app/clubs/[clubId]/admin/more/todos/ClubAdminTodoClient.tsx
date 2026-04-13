"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Public_Sans } from "next/font/google";
import { AnimatePresence, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { CSSProperties } from "react";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { TodoApplicationManagerModal } from "@/app/components/TodoApplicationManagerModal";
import { useAppToast } from "@/app/hooks/useAppToast";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import {
  getClubAdminTodoApplications,
  type ClubAdminTodoResponse,
  type TodoItemApplicationsResponse,
  type TodoSummary,
} from "@/app/lib/clubs";
import { FAB_RIGHT_OFFSET_CLASS_NAME, getActionFabBottomClass } from "@/app/lib/fab";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import {
  deleteTodoMutationOptions,
  reviewTodoApplicationMutationOptions,
  saveTodoMutationOptions,
  updateTodoStatusMutationOptions,
} from "@/app/lib/react-query/todos/mutations";
import {
  adminTodoApplicationsQueryOptions,
  adminTodosQueryOptions,
} from "@/app/lib/react-query/todos/queries";
import {
  type ApplicationFilter,
  type AssignmentFilter,
  type AssignmentMode,
  combineDateTimeValue,
  getStatusUpdateMessages,
  normalizeAssignmentMode,
  normalizeTodoType,
  type StatusFilter,
  splitDateTimeValue,
  resolveErrorMessage,
  type TodoEditorModalState,
  type TodoType,
} from "./todoOptions";
import {
  TodoEditorModal,
  TodoFilterModal,
  TodoFilterSummarySection,
  TodoListSection,
  TodoSnapshotSection,
} from "./todoUi";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

type ClubAdminTodoClientProps = {
  clubId: string;
  initialData: ClubAdminTodoResponse;
};

export function ClubAdminTodoClient({ clubId, initialData }: ClubAdminTodoClientProps) {
  const queryClient = useQueryClient();
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
  const { showToast, clearToast } = useAppToast();
  const saveTodoMutation = useMutation(saveTodoMutationOptions(clubId));
  const updateTodoStatusMutation = useMutation(updateTodoStatusMutationOptions(clubId));
  const reviewTodoApplicationMutation = useMutation(reviewTodoApplicationMutationOptions(clubId));
  const deleteTodoMutation = useMutation(deleteTodoMutationOptions(clubId));

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
  const assignedMemberLabel =
    assignmentMode === "OPEN_SUPPORT"
      ? "신청 모집에서는 담당자를 미리 고르지 않습니다."
      : assignedMember?.memberDisplayName ??
        editingItem?.assignedDisplayName ??
        inactiveAssignedOption?.label ??
        "담당자를 선택하세요.";

  const reloadTodos = async (
    nextStatusFilter = statusFilter,
    nextAssignmentFilter = assignmentFilter,
    nextApplicationFilter = applicationFilter,
    { showErrorToast = true }: { showErrorToast?: boolean } = {},
  ) => {
    try {
      const data = await queryClient.fetchQuery(
        adminTodosQueryOptions(clubId, {
          statusFilter: nextStatusFilter,
          assignmentFilter: nextAssignmentFilter,
          applicationFilter: nextApplicationFilter,
        }),
      );
      setTodoData(data);
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
      const result = await saveTodoMutation.mutateAsync({
        request,
        todoItemId: isEditMode ? editorModal.todoItemId : undefined,
      });

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

      void invalidateClubQueries(queryClient, clubId);
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
      const result = await updateTodoStatusMutation.mutateAsync({ todoItemId, statusCode: nextStatus });

      if (!result.ok || !result.data) {
        showToast(result.message ?? messages.failure, "error");
        return;
      }

      const reloaded = await reloadTodos(undefined, undefined, undefined, { showErrorToast: false });
      if (!reloaded) {
        showToast(messages.refreshFailure, "error");
        return;
      }

      void invalidateClubQueries(queryClient, clubId);
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
      const nextData = await queryClient.fetchQuery(
        adminTodosQueryOptions(clubId, {
          statusFilter,
          assignmentFilter,
          applicationFilter,
          cursorTodoItemId: todoData.nextCursorTodoItemId,
        }),
      );

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
      const data = await queryClient.fetchQuery(
        adminTodoApplicationsQueryOptions(clubId, item.todoItemId),
      );
      setApplicationModalData(data);
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
      const result = await reviewTodoApplicationMutation.mutateAsync({
        todoItemId: applicationModalItem.todoItemId,
        todoItemApplicationId: application.todoItemApplicationId,
        applicationStatus: nextStatus,
      });
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

      void invalidateClubQueries(queryClient, clubId);
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
      const result = await deleteTodoMutation.mutateAsync(deletingTodoItem.todoItemId);
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

      void invalidateClubQueries(queryClient, clubId);
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
          <TodoSnapshotSection todoData={todoData} reduceMotion={reduceMotion} />
          <TodoFilterSummarySection
            itemCount={todoData.items.length}
            statusFilter={statusFilter}
            assignmentFilter={assignmentFilter}
            applicationFilter={applicationFilter}
            reduceMotion={reduceMotion}
            onOpenFilter={openFilterModal}
          />
          <TodoListSection
            todoData={todoData}
            pendingTodoId={pendingTodoId}
            isLoadingMore={isLoadingMore}
            reduceMotion={reduceMotion}
            onOpenEditor={openEditModal}
            onOpenApplications={(item) => void loadApplicationModal(item)}
            onDeleteRequest={setDeletingTodoItem}
            onUpdateStatus={(todoItemId, nextStatus) => void handleStatusUpdate(todoItemId, nextStatus)}
            onLoadMore={() => void handleLoadMore()}
          />
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
            <TodoEditorModal
              editorModal={editorModal}
              canCreate={canCreate}
              canAssign={canAssign}
              title={title}
              description={description}
              todoType={todoType}
              assignmentMode={assignmentMode}
              assignedClubProfileId={assignedClubProfileId}
              dueAtDate={dueAtDate}
              dueAtTime={dueAtTime}
              isSubmitting={isSubmitting}
              availableMembers={todoData.availableMembers}
              assignedMemberLabel={assignedMemberLabel}
              inactiveAssignedOption={inactiveAssignedOption}
              editingItem={editingItem}
              onClose={() => closeEditorModal()}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onTodoTypeChange={setTodoType}
              onAssignmentModeChange={setAssignmentMode}
              onAssignedClubProfileIdChange={setAssignedClubProfileId}
              onDueAtDateChange={setDueAtDate}
              onDueAtTimeChange={setDueAtTime}
              onSubmit={() => void handleSubmit()}
            />
          ) : null}
          {filterModalOpen ? (
            <TodoFilterModal
              status={filterDraftStatus}
              assignment={filterDraftAssignment}
              application={filterDraftApplication}
              onClose={closeFilterModal}
              onStatusChange={setFilterDraftStatus}
              onAssignmentChange={setFilterDraftAssignment}
              onApplicationChange={setFilterDraftApplication}
              onReset={() => {
                setFilterDraftStatus("ALL");
                setFilterDraftAssignment("ALL");
                setFilterDraftApplication("ALL");
              }}
              onApply={() => void applyFilters()}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence initial={false} mode="wait">
          {applicationModalItem ? (
            <TodoApplicationManagerModal
              data={applicationModalData}
              loading={isApplicationModalLoading}
              reviewingApplicationId={reviewingApplicationId}
              onDismiss={closeApplicationModal}
              onReview={handleReviewApplication}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
