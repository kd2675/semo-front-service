"use client";

import RouterLink from "next/link";
import { useState } from "react";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { TodoCollaborationPanel } from "@/app/components/TodoCollaborationPanel";
import { useAppToast } from "@/app/hooks/useAppToast";
import {
  type ClubTodoResponse,
  type TodoSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import {
  applyTodoMutationOptions,
  cancelTodoMutationOptions,
  completeTodoMutationOptions,
} from "@/app/lib/react-query/todos/mutations";
import { todoQueryOptions } from "@/app/lib/react-query/todos/queries";

type ClubTodoClientProps = {
  clubId: string;
  initialData: ClubTodoResponse;
  isAdmin: boolean;
};

export function ClubTodoClient({ clubId, initialData }: ClubTodoClientProps) {
  const queryClient = useQueryClient();
  const reduceMotion = useHydrationSafeReducedMotion();
  const [claimableSize, setClaimableSize] = useState(8);
  const todoQuery = useQuery({
    ...todoQueryOptions(clubId, claimableSize),
    initialData: claimableSize === 8 ? initialData : undefined,
    placeholderData: keepPreviousData,
  });
  const todoData = todoQuery.data ?? initialData;
  const [pendingTodoId, setPendingTodoId] = useState<number | null>(null);
  const { showToast, clearToast } = useAppToast();
  const applyTodoMutation = useMutation(applyTodoMutationOptions(clubId));
  const cancelTodoMutation = useMutation(cancelTodoMutationOptions(clubId));
  const completeTodoMutation = useMutation(completeTodoMutationOptions(clubId));

  const reloadTodos = async () => {
    const result = await todoQuery.refetch();
    if (!result.data) {
      showToast("할 일 정보를 다시 불러오지 못했습니다.", "error");
      return false;
    }
    return true;
  };

  const handleApply = async (todoItemId: number) => {
    setPendingTodoId(todoItemId);
    clearToast();
    const result = await applyTodoMutation.mutateAsync(todoItemId);
    setPendingTodoId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "업무 신청에 실패했습니다.", "error");
      return;
    }
    await reloadTodos();
    void invalidateClubQueries(queryClient, clubId);
    showToast("업무를 신청했습니다.", "success");
  };

  const handleCancelApplication = async (todoItemId: number) => {
    setPendingTodoId(todoItemId);
    clearToast();
    const result = await cancelTodoMutation.mutateAsync(todoItemId);
    setPendingTodoId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "업무 신청을 취소하지 못했습니다.", "error");
      return;
    }
    await reloadTodos();
    void invalidateClubQueries(queryClient, clubId);
    showToast("업무 신청을 취소했습니다.", "success");
  };

  const handleComplete = async (todoItemId: number) => {
    setPendingTodoId(todoItemId);
    clearToast();
    const result = await completeTodoMutation.mutateAsync(todoItemId);
    setPendingTodoId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "업무를 완료 처리하지 못했습니다.", "error");
      return;
    }
    await reloadTodos();
    void invalidateClubQueries(queryClient, clubId);
    showToast("업무를 완료 처리했습니다.", "success");
  };

  return (
    <div className="bg-[var(--background-light)] text-slate-900 antialiased">
      <div className="relative min-h-screen">
        <ClubPageHeader
          title="할 일"
          subtitle={todoData.clubName}
          icon="assignment"
          className="bg-white/85 backdrop-blur-md"
        />

        <main className="semo-page-user semo-nav-bottom-space flex flex-col gap-4 px-4 pt-4">
          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              내 할 일
            </p>
            <h2 className="mt-3 text-xl font-bold">
              운영자가 선발하는 신청형 업무와 내 배정 업무를 한 번에 확인합니다.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              신청형 업무는 바로 배정되지 않고, 신청 후 운영진이 검토해 담당자를 확정합니다.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryCard label="내 진행" value={todoData.myOpenCount} />
              <SummaryCard label="신청 대기" value={todoData.myApplyingCount} />
              <SummaryCard label="모집 중" value={todoData.claimableOpenCount} />
              <SummaryCard label="지연" value={todoData.overdueCount} />
            </div>
          </motion.section>

          <TodoSection
            clubId={clubId}
            title="내 할 일"
            countLabel={`${todoData.myTodos.length}건`}
            emptyMessage="현재 배정된 할 일이 없습니다."
            items={todoData.myTodos}
            reduceMotion={reduceMotion}
            offset={1}
            pendingTodoId={pendingTodoId}
            onApply={handleApply}
            onCancelApplication={handleCancelApplication}
            onComplete={handleComplete}
            footer={todoData.hasMoreClaimable ? (
              <button
                type="button"
                onClick={() => setClaimableSize((current) => Math.min(current + 8, 50))}
                disabled={todoQuery.isFetching || claimableSize >= 50}
                className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                {todoQuery.isFetching ? "불러오는 중..." : claimableSize >= 50 ? "최대 50건까지 표시" : "업무 더 보기"}
              </button>
            ) : null}
          />

          <TodoSection
            clubId={clubId}
            title="신청 가능한 업무"
            countLabel={`${todoData.claimableTodos.length}건`}
            emptyMessage="지금 신청 가능한 업무가 없습니다."
            items={todoData.claimableTodos}
            reduceMotion={reduceMotion}
            offset={2 + todoData.myTodos.length}
            pendingTodoId={pendingTodoId}
            onApply={handleApply}
            onCancelApplication={handleCancelApplication}
            onComplete={handleComplete}
          />

          <TodoSection
            clubId={clubId}
            title="최근 완료"
            countLabel={`${todoData.recentCompletedTodos.length}건`}
            emptyMessage="최근 완료한 업무가 없습니다."
            items={todoData.recentCompletedTodos}
            reduceMotion={reduceMotion}
            offset={3 + todoData.myTodos.length + todoData.claimableTodos.length}
            pendingTodoId={pendingTodoId}
            onApply={handleApply}
            onCancelApplication={handleCancelApplication}
            onComplete={handleComplete}
            muted
          />
        </main>

      </div>
    </div>
  );
}

function TodoSection({
  clubId,
  title,
  countLabel,
  emptyMessage,
  items,
  reduceMotion,
  offset,
  pendingTodoId,
  onApply,
  onCancelApplication,
  onComplete,
  muted = false,
  footer,
}: {
  clubId: string;
  title: string;
  countLabel: string;
  emptyMessage: string;
  items: TodoSummary[];
  reduceMotion: boolean;
  offset: number;
  pendingTodoId: number | null;
  onApply: (todoItemId: number) => Promise<void>;
  onCancelApplication: (todoItemId: number) => Promise<void>;
  onComplete: (todoItemId: number) => Promise<void>;
  muted?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <motion.section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      {...staggeredFadeUpMotion(offset, reduceMotion)}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold">{title}</h3>
        <span className="text-xs font-medium text-slate-400">{countLabel}</span>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          items.map((item, index) => (
            <motion.article
              key={item.todoItemId}
              className={`rounded-2xl border p-4 ${
                muted
                  ? "border-slate-100 bg-slate-50"
                  : item.overdue
                    ? "border-rose-200 bg-rose-50/40"
                    : item.statusCode === "IN_PROGRESS"
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-slate-200 bg-white"
              }`}
              {...staggeredFadeUpMotion(offset + index + 1, reduceMotion)}
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
                <Badge tone={item.statusCode === "COMPLETED" ? "emerald" : item.overdue ? "rose" : "slate"} label={item.overdue ? "지연" : item.statusLabel} />
                {item.myApplicationStatusLabel ? (
                  <Badge
                    tone={item.myApplicationStatus === "REJECTED" ? "rose" : item.myApplicationStatus === "SELECTED" ? "emerald" : "amber"}
                    label={item.myApplicationStatusLabel}
                  />
                ) : null}
              </div>
              <p className="mt-3 text-base font-bold text-slate-900">{item.title}</p>
              {item.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-500">
                <InfoItem
                  label={item.assignmentMode === "OPEN_SUPPORT" ? "선정 인원" : "담당자"}
                  value={item.assignees.length > 0
                    ? `${item.assignees.map((assignee) => assignee.displayName ?? "멤버").join(", ")} · ${item.assigneeCount}명`
                    : item.assignedDisplayName ?? "미배정"}
                />
                <InfoItem label="마감일" value={item.dueAtLabel ?? "미정"} />
                <InfoItem label="업무 시간" value={item.workTimeLabel ?? "미정"} />
                <InfoItem label="등록자" value={item.createdByDisplayName ?? "미정"} />
                <InfoItem
                  label={item.assignmentMode === "OPEN_SUPPORT" ? "모집 현황" : "완료 시각"}
                  value={item.assignmentMode === "OPEN_SUPPORT"
                    ? `${item.assigneeCount}/${item.recruitmentCapacity}명${item.recruitmentFull ? " · 마감" : ""}`
                    : item.completedAtLabel ?? "없음"}
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
              {item.canApply || item.canCancelApplication || item.canComplete ? (
                <div className="mt-4 flex gap-2">
                  {item.canApply ? (
                    <button
                      type="button"
                      onClick={() => void onApply(item.todoItemId)}
                      disabled={pendingTodoId === item.todoItemId}
                      className="min-h-11 flex-1 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {pendingTodoId === item.todoItemId
                        ? "처리 중..."
                        : item.myApplicationStatus === "REJECTED"
                          ? "다시 신청"
                          : "신청하기"}
                    </button>
                  ) : null}
                  {item.canCancelApplication ? (
                    <button
                      type="button"
                      onClick={() => void onCancelApplication(item.todoItemId)}
                      disabled={pendingTodoId === item.todoItemId}
                      className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      {pendingTodoId === item.todoItemId ? "처리 중..." : "신청 취소"}
                    </button>
                  ) : null}
                  {item.canComplete ? (
                    <button
                      type="button"
                      onClick={() => void onComplete(item.todoItemId)}
                      disabled={pendingTodoId === item.todoItemId}
                      className="min-h-11 flex-1 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {pendingTodoId === item.todoItemId ? "처리 중..." : "완료 처리"}
                    </button>
                  ) : null}
                </div>
              ) : null}
              <TodoCollaborationPanel
                clubId={clubId}
                todoItemId={item.todoItemId}
                terminal={item.statusCode === "COMPLETED" || item.statusCode === "CANCELED"}
                theme="user"
              />
            </motion.article>
          ))
        )}
      </div>
      {footer}
    </motion.section>
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

function Badge({ tone, label }: { tone: "sky" | "slate" | "amber" | "blue" | "emerald" | "rose"; label: string }) {
  const className = {
    sky: "bg-sky-50 text-sky-700",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  }[tone];

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
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
