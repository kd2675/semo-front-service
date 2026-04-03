"use client";

import { Public_Sans } from "next/font/google";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { CSSProperties } from "react";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { RouteModal } from "@/app/components/RouteModal";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import {
  createClubTodo,
  getClubAdminTodos,
  updateClubTodo,
  updateClubTodoStatus,
  type ClubAdminTodoResponse,
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
type AssignmentFilter = "ALL" | "ASSIGNED" | "UNASSIGNED" | "OPEN_SUPPORT";
type TodoType = "VOLUNTEER" | "OPERATIONS";
type AssignmentMode = "DIRECT_ASSIGN" | "OPEN_SUPPORT";
type TodoEditorModalState =
  | { mode: "create" }
  | { mode: "edit"; todoItemId: number; original: TodoSummary };

const STATUS_OPTIONS: StatusFilter[] = ["ALL", "OPEN", "IN_PROGRESS", "COMPLETED", "OVERDUE"];
const ASSIGNMENT_OPTIONS: AssignmentFilter[] = ["ALL", "ASSIGNED", "UNASSIGNED", "OPEN_SUPPORT"];

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

export function ClubAdminTodoClient({ clubId, initialData }: ClubAdminTodoClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [todoData, setTodoData] = useState(initialData);
  const canCreate = todoData.canCreate;
  const canAssign = todoData.canAssign;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("ALL");
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

  const reloadTodos = async (nextStatusFilter = statusFilter, nextAssignmentFilter = assignmentFilter) => {
    const result = await getClubAdminTodos(clubId, {
      statusFilter: nextStatusFilter,
      assignmentFilter: nextAssignmentFilter,
    });
    if (!result.ok || !result.data) {
      showToast(result.message ?? "할 일 운영 정보를 다시 불러오지 못했습니다.", "error");
      return false;
    }
    setTodoData(result.data);
    return true;
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
  ) => {
    setStatusFilter(nextStatusFilter);
    setAssignmentFilter(nextAssignmentFilter);
    clearToast();
    await reloadTodos(nextStatusFilter, nextAssignmentFilter);
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

    const result =
      editorModal.mode === "edit"
        ? await updateClubTodo(clubId, editorModal.todoItemId, request)
        : await createClubTodo(clubId, request);

    setIsSubmitting(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "할 일을 저장하지 못했습니다.", "error");
      return;
    }

    await reloadTodos();
    closeEditorModal({ force: true });
    showToast(editorModal.mode === "edit" ? "할 일을 수정했습니다." : "할 일을 등록했습니다.", "success");
  };

  const handleStatusUpdate = async (todoItemId: number, nextStatus: string) => {
    setPendingTodoId(todoItemId);
    clearToast();
    const result = await updateClubTodoStatus(clubId, todoItemId, { statusCode: nextStatus });
    setPendingTodoId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "상태를 변경하지 못했습니다.", "error");
      return;
    }
    await reloadTodos();
    showToast("상태를 변경했습니다.", "success");
  };

  const handleLoadMore = async () => {
    if (!todoData.hasNext || todoData.nextCursorTodoItemId == null) {
      return;
    }
    setIsLoadingMore(true);
    const result = await getClubAdminTodos(clubId, {
      statusFilter,
      assignmentFilter,
      cursorTodoItemId: todoData.nextCursorTodoItemId,
    });
    setIsLoadingMore(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "목록을 더 불러오지 못했습니다.", "error");
      return;
    }
    const nextData = result.data;

    setTodoData((current) => ({
      ...nextData,
      items: [...current.items, ...nextData.items],
    }));
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
              <SummaryCard label="지연" value={todoData.overdueCount} />
            </div>
            <div className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-slate-600">
              활성 멤버 {todoData.activeMemberCount}명 기준으로 업무를 배정하고 미완료 건을 추적합니다.
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
            <div className="grid grid-cols-2 gap-3">
              <select
                value={statusFilter}
                onChange={(event) => void handleFilterChange(event.target.value as StatusFilter, assignmentFilter)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "상태 전체" : option}
                  </option>
                ))}
              </select>
              <select
                value={assignmentFilter}
                onChange={(event) => void handleFilterChange(statusFilter, event.target.value as AssignmentFilter)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              >
                {ASSIGNMENT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "배정 전체" : option}
                  </option>
                ))}
              </select>
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
                todoData.items.map((item, index) => (
                  <motion.article
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
                      <InfoItem label="완료 시각" value={item.completedAtLabel ?? "없음"} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.canEdit ? (
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                        >
                          수정
                        </button>
                      ) : null}
                      {!item.canEdit &&
                      todoData.canAssign &&
                      item.statusCode !== "COMPLETED" &&
                      item.statusCode !== "CANCELED" ? (
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                        >
                          배정
                        </button>
                      ) : null}
                      {item.canManageStatus ? (
                        <>
                          {item.statusCode !== "IN_PROGRESS" ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(item.todoItemId, "IN_PROGRESS")}
                              disabled={pendingTodoId === item.todoItemId}
                              className="rounded-full bg-amber-500 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              진행중
                            </button>
                          ) : null}
                          {item.statusCode !== "COMPLETED" ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(item.todoItemId, "COMPLETED")}
                              disabled={pendingTodoId === item.todoItemId}
                              className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              완료
                            </button>
                          ) : null}
                          {item.statusCode !== "OPEN" ? (
                            <button
                              type="button"
                              onClick={() => void handleStatusUpdate(item.todoItemId, "OPEN")}
                              disabled={pendingTodoId === item.todoItemId}
                              className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                            >
                              다시 열기
                            </button>
                          ) : null}
                          {item.statusCode !== "CANCELED" ? (
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
                  </motion.article>
                ))
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
                            <label className="block">
                              <span className="text-sm font-semibold text-slate-700">업무 유형</span>
                              <select
                                value={todoType}
                                onChange={(event) => setTodoType(event.target.value as TodoType)}
                                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                              >
                                <option value="OPERATIONS">운영</option>
                                <option value="VOLUNTEER">봉사</option>
                              </select>
                            </label>

                            <div>
                              <span className="text-sm font-semibold text-slate-700">마감일</span>
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                <input
                                  type="date"
                                  value={dueAtDate}
                                  onChange={(event) => setDueAtDate(event.target.value)}
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                                />
                                <input
                                  type="time"
                                  value={dueAtTime}
                                  onChange={(event) => setDueAtTime(event.target.value)}
                                  disabled={!dueAtDate}
                                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                />
                              </div>
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDueAtDate("");
                                    setDueAtTime("");
                                  }}
                                  disabled={!dueAtDate}
                                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                  마감일 미정
                                </button>
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
                          <label className="block">
                            <span className="text-sm font-semibold text-slate-700">배정 방식</span>
                            <select
                              value={assignmentMode}
                              onChange={(event) => {
                                const nextMode = event.target.value as AssignmentMode;
                                setAssignmentMode(nextMode);
                                if (nextMode === "OPEN_SUPPORT") {
                                  setAssignedClubProfileId("");
                                }
                              }}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                            >
                              <option value="DIRECT_ASSIGN">직접 배정</option>
                              <option value="OPEN_SUPPORT">지원 가능</option>
                            </select>
                          </label>

                          <label className="block">
                            <span className="text-sm font-semibold text-slate-700">담당자</span>
                            <select
                              value={assignedClubProfileId}
                              onChange={(event) => setAssignedClubProfileId(event.target.value)}
                              disabled={assignmentMode === "OPEN_SUPPORT"}
                              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              <option value="">담당자 선택</option>
                              {inactiveAssignedOption ? (
                                <option value={inactiveAssignedOption.clubProfileId}>
                                  {inactiveAssignedOption.label}
                                </option>
                              ) : null}
                              {todoData.availableMembers.map((member) => (
                                <option key={member.clubProfileId} value={member.clubProfileId}>
                                  {member.memberDisplayName} · {member.memberRoleCode}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      ) : canCreate ? (
                        <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600">
                          {editorModal.mode === "edit" ? (
                            <>
                              <p className="font-semibold text-slate-900">
                                배정 권한이 없어 현재 배정 상태를 유지한 채 기본 정보만 수정합니다.
                              </p>
                              <p className="mt-2">
                                배정 방식: {assignmentMode === "OPEN_SUPPORT" ? "지원 가능" : "직접 배정"}
                              </p>
                              <p className="mt-1">
                                담당자: {assignedMember?.memberDisplayName ?? editingItem?.assignedDisplayName ?? "미배정"}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-slate-900">
                                배정 권한이 없어 새 업무는 지원 가능 상태로 등록됩니다.
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
        </AnimatePresence>
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
