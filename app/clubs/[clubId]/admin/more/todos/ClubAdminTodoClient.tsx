"use client";

import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { TodoApplicationManagerModal } from "@/app/components/TodoApplicationManagerModal";
import { useAppToast } from "@/app/hooks/useAppToast";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/modals/ScheduleActionConfirmModal";
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
  normalizeTodoPriority,
  normalizeTodoRecurrence,
  normalizeTodoType,
  type StatusFilter,
  splitDateTimeValue,
  resolveErrorMessage,
  type TodoEditorModalState,
  type TodoPriority,
  type TodoRecurrence,
  type TodoType,
} from "./utils/todoOptions";
import {
  TodoEditorModal,
  TodoFilterModal,
  TodoFilterSummarySection,
  TodoListSection,
  TodoSnapshotSection,
} from "./components/todoUi";

type ClubAdminTodoClientProps = {
  clubId: string;
  initialData: ClubAdminTodoResponse;
};

export function ClubAdminTodoClient({ clubId, initialData }: ClubAdminTodoClientProps) {
  const queryClient = useQueryClient();
  const reduceMotion = useHydrationSafeReducedMotion();
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
  const [assignedClubProfileIds, setAssignedClubProfileIds] = useState<string[]>([]);
  const [priorityCode, setPriorityCode] = useState<TodoPriority>("NORMAL");
  const [recruitmentCapacity, setRecruitmentCapacity] = useState("1");
  const [dueAtDate, setDueAtDate] = useState("");
  const [dueAtTime, setDueAtTime] = useState("");
  const [workStartDate, setWorkStartDate] = useState("");
  const [workStartTime, setWorkStartTime] = useState("");
  const [workEndDate, setWorkEndDate] = useState("");
  const [workEndTime, setWorkEndTime] = useState("");
  const [linkedScheduleEventId, setLinkedScheduleEventId] = useState("");
  const [linkedDecisionRecordId, setLinkedDecisionRecordId] = useState("");
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<TodoRecurrence>("NONE");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
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
  const editingAssignees = editingItem?.assignees.length
    ? editingItem.assignees
    : editingItem?.assignedClubProfileId != null
      ? [{
          clubProfileId: editingItem.assignedClubProfileId,
          displayName: editingItem.assignedDisplayName,
        }]
      : [];
  const inactiveAssignedOptions = editingAssignees
    .filter((assignee) => !todoData.availableMembers.some(
      (member) => member.clubProfileId === assignee.clubProfileId,
    ))
    .map((assignee) => ({
      clubProfileId: assignee.clubProfileId,
      label: `${assignee.displayName ?? "기존 담당자"} · 현재 비활성`,
    }));
  const selectedAssigneeLabels = assignedClubProfileIds.map((clubProfileId) => {
    const activeMember = todoData.availableMembers.find(
      (member) => String(member.clubProfileId) === clubProfileId,
    );
    const inactiveMember = inactiveAssignedOptions.find(
      (member) => String(member.clubProfileId) === clubProfileId,
    );
    return activeMember?.memberDisplayName ?? inactiveMember?.label ?? "알 수 없는 담당자";
  });
  const assignedMemberLabel =
    assignmentMode === "OPEN_SUPPORT"
      ? "신청 모집에서는 담당자를 미리 고르지 않습니다."
      : selectedAssigneeLabels.length > 0
        ? `${selectedAssigneeLabels.join(", ")} · ${selectedAssigneeLabels.length}명`
        : "담당자를 선택하세요.";

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
    setAssignedClubProfileIds([]);
    setPriorityCode("NORMAL");
    setRecruitmentCapacity("1");
    setDueAtDate("");
    setDueAtTime("");
    setWorkStartDate("");
    setWorkStartTime("");
    setWorkEndDate("");
    setWorkEndTime("");
    setLinkedScheduleEventId("");
    setLinkedDecisionRecordId("");
    setRecurrenceFrequency("NONE");
    setRecurrenceInterval("1");
    setRecurrenceEndDate("");
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
    const workStartAt = splitDateTimeValue(item.workStartAt);
    const workEndAt = splitDateTimeValue(item.workEndAt);
    setTitle(item.title);
    setDescription(item.description ?? "");
    setTodoType(normalizeTodoType(item.todoType));
    setAssignmentMode(normalizeAssignmentMode(item.assignmentMode));
    setAssignedClubProfileIds(
      item.assignees.length > 0
        ? item.assignees.map((assignee) => String(assignee.clubProfileId))
        : item.assignedClubProfileId != null
          ? [String(item.assignedClubProfileId)]
          : [],
    );
    setPriorityCode(normalizeTodoPriority(item.priorityCode));
    setRecruitmentCapacity(String(Math.max(1, item.recruitmentCapacity)));
    setDueAtDate(dueAt.date);
    setDueAtTime(dueAt.time);
    setWorkStartDate(workStartAt.date);
    setWorkStartTime(workStartAt.time);
    setWorkEndDate(workEndAt.date);
    setWorkEndTime(workEndAt.time);
    setLinkedScheduleEventId(item.linkedScheduleEventId != null ? String(item.linkedScheduleEventId) : "");
    setLinkedDecisionRecordId(item.linkedDecisionRecordId != null ? String(item.linkedDecisionRecordId) : "");
    setRecurrenceFrequency(normalizeTodoRecurrence(item.recurrenceFrequency));
    setRecurrenceInterval(String(Math.max(1, item.recurrenceInterval)));
    setRecurrenceEndDate(item.recurrenceEndDate ?? "");
    setEditorModal({ mode: "edit", todoItemId: item.todoItemId, original: item });
  };

  const toggleAssignedClubProfileId = (clubProfileId: string) => {
    setAssignedClubProfileIds((current) => current.includes(clubProfileId)
      ? current.filter((value) => value !== clubProfileId)
      : [...current, clubProfileId]);
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

    if (canCreate && !title.trim()) {
      showToast("업무 이름을 입력해주세요.", "error");
      return;
    }
    if (canAssign && assignmentMode === "DIRECT_ASSIGN" && assignedClubProfileIds.length === 0) {
      showToast("직접 배정할 담당자를 한 명 이상 선택해주세요.", "error");
      return;
    }

    const capacity = Number(recruitmentCapacity);
    if (canAssign && assignmentMode === "OPEN_SUPPORT" && (
      !Number.isInteger(capacity) || capacity < 1 || capacity > 100
    )) {
      showToast("모집 인원은 1명 이상 100명 이하로 입력해주세요.", "error");
      return;
    }

    const workStartAt = combineDateTimeValue(workStartDate, workStartTime, "00:00");
    const workEndAt = combineDateTimeValue(workEndDate, workEndTime, "23:59");
    if (canCreate && workEndAt && !workStartAt) {
      showToast("업무 종료 시간을 설정하려면 시작 시간을 먼저 입력해주세요.", "error");
      return;
    }
    if (canCreate && workStartAt && workEndAt && new Date(workEndAt) <= new Date(workStartAt)) {
      showToast("업무 종료 시간은 시작 시간보다 늦어야 합니다.", "error");
      return;
    }

    const recurrenceIntervalValue = Number(recurrenceInterval);
    if (canCreate && recurrenceFrequency !== "NONE" && (
      !Number.isInteger(recurrenceIntervalValue)
      || recurrenceIntervalValue < 1
      || recurrenceIntervalValue > 12
    )) {
      showToast("반복 간격은 1 이상 12 이하로 입력해주세요.", "error");
      return;
    }
    const recurrenceAnchorDate = workStartDate || dueAtDate;
    if (canCreate && recurrenceFrequency !== "NONE" && !recurrenceAnchorDate) {
      showToast("반복 업무는 마감일 또는 업무 시작 시간이 필요합니다.", "error");
      return;
    }
    if (canCreate && recurrenceFrequency !== "NONE" && recurrenceEndDate
      && recurrenceAnchorDate && recurrenceEndDate < recurrenceAnchorDate) {
      showToast("반복 종료일은 첫 업무 기준일보다 빠를 수 없습니다.", "error");
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
      assignedClubProfileId: null,
      assignedClubProfileIds: canAssign
        ? nextAssignmentMode === "DIRECT_ASSIGN"
          ? assignedClubProfileIds.map(Number)
          : []
        : nextAssignmentMode === "DIRECT_ASSIGN"
          ? base?.assignees.length
            ? base.assignees.map((assignee) => assignee.clubProfileId)
            : base?.assignedClubProfileId != null
              ? [base.assignedClubProfileId]
              : []
          : [],
      priorityCode: canCreate ? priorityCode : base?.priorityCode ?? "NORMAL",
      recruitmentCapacity: canAssign && nextAssignmentMode === "OPEN_SUPPORT"
        ? capacity
        : base?.recruitmentCapacity ?? 1,
      dueAt: canCreate ? combineDateTimeValue(dueAtDate, dueAtTime) : base?.dueAt ?? null,
      workStartAt: canCreate ? workStartAt : base?.workStartAt ?? null,
      workEndAt: canCreate ? workEndAt : base?.workEndAt ?? null,
      linkedScheduleEventId: canCreate && linkedScheduleEventId
        ? Number(linkedScheduleEventId)
        : canCreate
          ? null
          : base?.linkedScheduleEventId ?? null,
      linkedDecisionRecordId: canCreate && linkedDecisionRecordId
        ? Number(linkedDecisionRecordId)
        : canCreate
          ? null
          : base?.linkedDecisionRecordId ?? null,
      recurrenceFrequency: canCreate ? recurrenceFrequency : base?.recurrenceFrequency ?? "NONE",
      recurrenceInterval: canCreate && recurrenceFrequency !== "NONE"
        ? recurrenceIntervalValue
        : canCreate
          ? 1
          : base?.recurrenceInterval ?? 1,
      recurrenceEndDate: canCreate && recurrenceFrequency !== "NONE"
        ? recurrenceEndDate || null
        : canCreate
          ? null
          : base?.recurrenceEndDate ?? null,
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
        showToast(result.message ?? "할 일을 보관하지 못했습니다.", "error");
        return;
      }
      setDeletingTodoItem(null);

      const reloaded = await reloadTodos(undefined, undefined, undefined, { showErrorToast: false });
      if (!reloaded) {
        showToast("할 일은 보관했지만 목록을 다시 불러오지 못했습니다.", "error");
        return;
      }

      void invalidateClubQueries(queryClient, clubId);
      showToast("할 일을 보관했습니다. 신청 기록은 유지됩니다.", "success");
    } catch (error) {
      showToast(resolveErrorMessage(error, "할 일을 보관하지 못했습니다."), "error");
    } finally {
      setPendingTodoId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)] text-slate-900">
      <div className="min-h-screen bg-[#f8f6f6]">
        <ClubPageHeader
          title="할 일 관리"
          subtitle={todoData.clubName}
          icon="assignment"
          theme="admin"
          containerClassName="semo-page-admin"
        />

        <main className="semo-page-admin semo-nav-bottom-space space-y-4 px-4 pt-4">
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
            clubId={clubId}
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
            className={`fixed ${FAB_RIGHT_OFFSET_CLASS_NAME} ${getActionFabBottomClass()} z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/25 transition-transform active:scale-95`}
          >
            <span className="material-symbols-outlined text-[28px]" aria-hidden="true">assignment_add</span>
          </button>
        ) : null}


        {deletingTodoItem ? (
          <ScheduleActionConfirmModal
            title="할 일을 보관할까요?"
            description="목록에서는 숨겨지지만 업무와 신청 기록은 감사 이력으로 유지됩니다."
            confirmLabel="보관"
            busyLabel="보관 중..."
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
              assignedClubProfileIds={assignedClubProfileIds}
              priorityCode={priorityCode}
              recruitmentCapacity={recruitmentCapacity}
              dueAtDate={dueAtDate}
              dueAtTime={dueAtTime}
              workStartDate={workStartDate}
              workStartTime={workStartTime}
              workEndDate={workEndDate}
              workEndTime={workEndTime}
              linkedScheduleEventId={linkedScheduleEventId}
              linkedDecisionRecordId={linkedDecisionRecordId}
              recurrenceFrequency={recurrenceFrequency}
              recurrenceInterval={recurrenceInterval}
              recurrenceEndDate={recurrenceEndDate}
              isSubmitting={isSubmitting}
              availableMembers={todoData.availableMembers}
              scheduleOptions={todoData.scheduleOptions}
              decisionOptions={todoData.decisionOptions}
              assignedMemberLabel={assignedMemberLabel}
              inactiveAssignedOptions={inactiveAssignedOptions}
              editingItem={editingItem}
              onClose={() => closeEditorModal()}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              onTodoTypeChange={setTodoType}
              onAssignmentModeChange={setAssignmentMode}
              onAssignedClubProfileIdToggle={toggleAssignedClubProfileId}
              onClearAssignedClubProfileIds={() => setAssignedClubProfileIds([])}
              onPriorityCodeChange={setPriorityCode}
              onRecruitmentCapacityChange={setRecruitmentCapacity}
              onDueAtDateChange={setDueAtDate}
              onDueAtTimeChange={setDueAtTime}
              onWorkStartDateChange={setWorkStartDate}
              onWorkStartTimeChange={setWorkStartTime}
              onWorkEndDateChange={setWorkEndDate}
              onWorkEndTimeChange={setWorkEndTime}
              onLinkedScheduleEventIdChange={setLinkedScheduleEventId}
              onLinkedDecisionRecordIdChange={setLinkedDecisionRecordId}
              onRecurrenceFrequencyChange={setRecurrenceFrequency}
              onRecurrenceIntervalChange={setRecurrenceInterval}
              onRecurrenceEndDateChange={setRecurrenceEndDate}
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
