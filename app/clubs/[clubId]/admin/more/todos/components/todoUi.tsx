"use client";

import { motion } from "motion/react";
import RouterLink from "next/link";

import { TodoCollaborationPanel } from "@/app/components/TodoCollaborationPanel";
import type { ClubAdminTodoResponse, TodoSummary } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import {
  type ApplicationFilter,
  type AssignmentFilter,
  getApplicationFilterLabel,
  getAssignmentFilterLabel,
  getStatusFilterLabel,
  type StatusFilter,
} from "../utils/todoOptions";
import { TodoInfoItem } from "./TodoInfoItem";

export { TodoEditorModal } from "./TodoEditorModal";
export { TodoFilterModal } from "./TodoFilterModal";

export function TodoSnapshotSection({
  todoData,
  reduceMotion,
}: {
  todoData: ClubAdminTodoResponse;
  reduceMotion: boolean;
}) {
  return (
    <motion.section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      {...staggeredFadeUpMotion(0, reduceMotion)}
    >
      <p className="text-xs font-semibold tracking-wide text-slate-400">운영 요약</p>
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
  );
}

export function TodoFilterSummarySection({
  itemCount,
  statusFilter,
  assignmentFilter,
  applicationFilter,
  reduceMotion,
  onOpenFilter,
}: {
  itemCount: number;
  statusFilter: StatusFilter;
  assignmentFilter: AssignmentFilter;
  applicationFilter: ApplicationFilter;
  reduceMotion: boolean;
  onOpenFilter: () => void;
}) {
  return (
    <motion.section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      {...staggeredFadeUpMotion(1, reduceMotion)}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold">운영 필터</h3>
        <span className="text-xs font-medium text-slate-400">{itemCount}건</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpenFilter}
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
  );
}

export function TodoListSection({
  clubId,
  todoData,
  pendingTodoId,
  isLoadingMore,
  reduceMotion,
  onOpenEditor,
  onOpenApplications,
  onDeleteRequest,
  onUpdateStatus,
  onLoadMore,
}: {
  clubId: string;
  todoData: ClubAdminTodoResponse;
  pendingTodoId: number | null;
  isLoadingMore: boolean;
  reduceMotion: boolean;
  onOpenEditor: (item: TodoSummary) => void;
  onOpenApplications: (item: TodoSummary) => void;
  onDeleteRequest: (item: TodoSummary) => void;
  onUpdateStatus: (todoItemId: number, nextStatus: string) => void;
  onLoadMore: () => void;
}) {
  return (
    <motion.section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      {...staggeredFadeUpMotion(2, reduceMotion)}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold">업무 목록</h3>
        <span className="text-xs font-medium text-slate-400">{todoData.hasNext ? "계속 있음" : "마지막 페이지"}</span>
      </div>
      <div className="space-y-3">
        {todoData.items.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            현재 조건에 맞는 업무가 없습니다.
          </div>
        ) : (
          todoData.items.map((item, index) => (
            <TodoListCard
              key={item.todoItemId}
              clubId={clubId}
              item={item}
              canAssign={todoData.canAssign}
              canDelete={todoData.canDelete}
              pendingTodoId={pendingTodoId}
              reduceMotion={reduceMotion}
              motionIndex={index + 3}
              onOpenEditor={() => onOpenEditor(item)}
              onOpenApplications={() => onOpenApplications(item)}
              onDeleteRequest={() => onDeleteRequest(item)}
              onUpdateStatus={onUpdateStatus}
            />
          ))
        )}
      </div>

      {todoData.hasNext ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {isLoadingMore ? "불러오는 중..." : "더 보기"}
        </button>
      ) : null}
    </motion.section>
  );
}

function TodoListCard({
  clubId,
  item,
  canAssign,
  canDelete,
  pendingTodoId,
  reduceMotion,
  motionIndex,
  onOpenEditor,
  onOpenApplications,
  onDeleteRequest,
  onUpdateStatus,
}: {
  clubId: string;
  item: TodoSummary;
  canAssign: boolean;
  canDelete: boolean;
  pendingTodoId: number | null;
  reduceMotion: boolean;
  motionIndex: number;
  onOpenEditor: () => void;
  onOpenApplications: () => void;
  onDeleteRequest: () => void;
  onUpdateStatus: (todoItemId: number, nextStatus: string) => void;
}) {
  const isTerminal = item.statusCode === "COMPLETED" || item.statusCode === "CANCELED";
  const canOpenEditor = item.canEdit && !isTerminal;
  const canOpenAssignEditor = !item.canEdit && canAssign && !isTerminal;
  const canMarkInProgress = item.statusCode === "OPEN" && item.assigneeCount > 0;
  const canMarkCompleted =
    item.statusCode === "IN_PROGRESS" ||
    (item.statusCode === "OPEN" && item.assigneeCount > 0 && item.assignmentMode === "DIRECT_ASSIGN");
  const canResetToOpen = item.statusCode === "IN_PROGRESS";
  const canReopen = isTerminal;
  const canCancel = item.statusCode === "OPEN" || item.statusCode === "IN_PROGRESS";
  const resetToOpenLabel = item.assignmentMode === "OPEN_SUPPORT" ? "모집으로 되돌리기" : "대기로 되돌리기";

  return (
    <motion.article
      className={`rounded-2xl border p-4 ${
        item.overdue
          ? "border-rose-200 bg-rose-50/40"
          : item.statusCode === "IN_PROGRESS"
            ? "border-amber-200 bg-amber-50/40"
            : item.statusCode === "COMPLETED"
              ? "border-emerald-200 bg-emerald-50/25"
              : "border-slate-200 bg-white"
      }`}
      {...staggeredFadeUpMotion(motionIndex, reduceMotion)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={item.todoType === "VOLUNTEER" ? "sky" : "slate"} label={item.todoTypeLabel} />
        <Badge tone={item.assignmentMode === "OPEN_SUPPORT" ? "amber" : "blue"} label={item.assignmentModeLabel} />
        {item.priorityCode !== "NORMAL" ? (
          <Badge
            tone={item.priorityCode === "URGENT" ? "rose" : item.priorityCode === "HIGH" ? "amber" : "slate"}
            label={item.priorityLabel}
          />
        ) : null}
        {item.recurrenceFrequency !== "NONE" ? (
          <Badge tone="blue" label={item.recurrenceLabel} />
        ) : null}
        <Badge
          tone={item.statusCode === "COMPLETED" ? "emerald" : item.overdue ? "rose" : "slate"}
          label={item.overdue ? "지연" : item.statusLabel}
        />
      </div>
      <p className="mt-3 text-base font-bold text-slate-900">{item.title}</p>
      {item.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
        <TodoInfoItem
          label={item.assignmentMode === "OPEN_SUPPORT" ? "선정 인원" : "담당자"}
          value={item.assigneeCount > 0
            ? `${item.assignees.map((assignee) => assignee.displayName ?? "멤버").join(", ")} · ${item.assigneeCount}명`
            : "미배정"}
        />
        <TodoInfoItem label="마감일" value={item.dueAtLabel ?? "미정"} />
        <TodoInfoItem label="업무 시간" value={item.workTimeLabel ?? "미정"} />
        <TodoInfoItem label="등록자" value={item.createdByDisplayName ?? "미정"} />
        <TodoInfoItem
          label={item.assignmentMode === "OPEN_SUPPORT" ? "모집 현황" : "담당 인원"}
          value={item.assignmentMode === "OPEN_SUPPORT"
            ? `${item.assigneeCount}/${item.recruitmentCapacity}명 · 신청 ${item.applicationCount}건`
            : `${item.assigneeCount}명`}
        />
      </div>
      {item.linkedScheduleEventId != null ? (
        <RouterLink
          href={`/clubs/${clubId}/schedule/${item.linkedScheduleEventId}`}
          className="mt-4 flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)]/8 px-3 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">event</span>
          <span className="min-w-0 flex-1 truncate">{item.linkedScheduleTitle ?? "연결된 일정"}</span>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
        </RouterLink>
      ) : null}
      {item.linkedDecisionRecordId != null ? (
        <RouterLink
          href={`/clubs/${clubId}/admin/more/decisions`}
          className="mt-2 flex min-h-11 items-center gap-2 rounded-xl bg-[var(--primary)]/8 px-3 text-xs font-bold text-[var(--primary)] transition hover:bg-[var(--primary)]/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">gavel</span>
          <span className="min-w-0 flex-1 truncate">{item.linkedDecisionTitle ?? "연결된 결정 기록"}</span>
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
        </RouterLink>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {canOpenEditor ? (
          <button type="button" onClick={onOpenEditor} className="min-h-11 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white">
            수정
          </button>
        ) : null}
        {canOpenAssignEditor ? (
          <button type="button" onClick={onOpenEditor} className="min-h-11 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white">
            배정
          </button>
        ) : null}
        {item.canReviewApplications ? (
          <button
            type="button"
            onClick={onOpenApplications}
            className="min-h-11 rounded-xl bg-amber-50 px-4 text-xs font-bold text-amber-700 ring-1 ring-amber-200"
          >
            신청 관리 {item.applicationCount}
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            onClick={onDeleteRequest}
            disabled={pendingTodoId === item.todoItemId}
            className="min-h-11 rounded-xl bg-rose-50 px-4 text-xs font-bold text-rose-700 ring-1 ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            보관
          </button>
        ) : null}
        {item.canManageStatus ? (
          <>
            {canMarkInProgress ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.todoItemId, "IN_PROGRESS")}
                disabled={pendingTodoId === item.todoItemId}
                className="min-h-11 rounded-xl bg-amber-500 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                진행중
              </button>
            ) : null}
            {canMarkCompleted ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.todoItemId, "COMPLETED")}
                disabled={pendingTodoId === item.todoItemId}
                className="min-h-11 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                완료
              </button>
            ) : null}
            {canResetToOpen ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.todoItemId, "OPEN")}
                disabled={pendingTodoId === item.todoItemId}
                className="min-h-11 rounded-xl bg-white px-4 text-xs font-bold text-slate-700 ring-1 ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {resetToOpenLabel}
              </button>
            ) : null}
            {canReopen ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.todoItemId, "REOPEN")}
                disabled={pendingTodoId === item.todoItemId}
                className="min-h-11 rounded-xl bg-white px-4 text-xs font-bold text-slate-700 ring-1 ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                다시 열기
              </button>
            ) : null}
            {canCancel ? (
              <button
                type="button"
                onClick={() => onUpdateStatus(item.todoItemId, "CANCELED")}
                disabled={pendingTodoId === item.todoItemId}
                className="min-h-11 rounded-xl bg-rose-600 px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                취소
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      <TodoCollaborationPanel
        clubId={clubId}
        todoItemId={item.todoItemId}
        terminal={isTerminal}
        theme="admin"
      />
    </motion.article>
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

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>{label}</span>;
}
