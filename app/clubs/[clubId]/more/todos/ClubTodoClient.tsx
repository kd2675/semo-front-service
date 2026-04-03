"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import {
  claimClubTodo,
  completeClubTodo,
  getClubTodos,
  type ClubTodoResponse,
  type TodoSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubTodoClientProps = {
  clubId: string;
  initialData: ClubTodoResponse;
  isAdmin: boolean;
};

export function ClubTodoClient({ clubId, initialData, isAdmin }: ClubTodoClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [todoData, setTodoData] = useState(initialData);
  const [pendingTodoId, setPendingTodoId] = useState<number | null>(null);
  const { toast, showToast, clearToast } = useEphemeralToast();

  const reloadTodos = async () => {
    const result = await getClubTodos(clubId);
    if (!result.ok || !result.data) {
      showToast(result.message ?? "할 일 정보를 다시 불러오지 못했습니다.", "error");
      return false;
    }
    setTodoData(result.data);
    return true;
  };

  const handleClaim = async (todoItemId: number) => {
    setPendingTodoId(todoItemId);
    clearToast();
    const result = await claimClubTodo(clubId, todoItemId);
    setPendingTodoId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "업무를 맡지 못했습니다.", "error");
      return;
    }
    await reloadTodos();
    showToast("업무를 맡았습니다.", "success");
  };

  const handleComplete = async (todoItemId: number) => {
    setPendingTodoId(todoItemId);
    clearToast();
    const result = await completeClubTodo(clubId, todoItemId);
    setPendingTodoId(null);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "업무를 완료 처리하지 못했습니다.", "error");
      return;
    }
    await reloadTodos();
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

        <main className="semo-nav-bottom-space mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-4">
          <motion.section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              My Queue
            </p>
            <h2 className="mt-3 text-xl font-bold">
              누가 맡았는지 흐려지지 않게 내 업무와 지원 가능한 업무를 한 번에 확인합니다.
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              본인 할 일은 바로 완료 처리할 수 있고, 지원 가능한 봉사/운영 업무는 직접 맡아 진행으로 전환합니다.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <SummaryCard label="내 진행" value={todoData.myOpenCount} />
              <SummaryCard label="내 완료" value={todoData.myCompletedCount} />
              <SummaryCard label="지원 가능" value={todoData.claimableOpenCount} />
              <SummaryCard label="지연" value={todoData.overdueCount} />
            </div>
          </motion.section>

          <TodoSection
            title="내 할 일"
            countLabel={`${todoData.myTodos.length}건`}
            emptyMessage="현재 배정된 할 일이 없습니다."
            items={todoData.myTodos}
            reduceMotion={reduceMotion}
            offset={1}
            pendingTodoId={pendingTodoId}
            onClaim={handleClaim}
            onComplete={handleComplete}
          />

          <TodoSection
            title="지원 가능한 업무"
            countLabel={`${todoData.claimableTodos.length}건`}
            emptyMessage="지금 지원 가능한 업무가 없습니다."
            items={todoData.claimableTodos}
            reduceMotion={reduceMotion}
            offset={2 + todoData.myTodos.length}
            pendingTodoId={pendingTodoId}
            onClaim={handleClaim}
            onComplete={handleComplete}
          />

          <TodoSection
            title="최근 완료"
            countLabel={`${todoData.recentCompletedTodos.length}건`}
            emptyMessage="최근 완료한 업무가 없습니다."
            items={todoData.recentCompletedTodos}
            reduceMotion={reduceMotion}
            offset={3 + todoData.myTodos.length + todoData.claimableTodos.length}
            pendingTodoId={pendingTodoId}
            onClaim={handleClaim}
            onComplete={handleComplete}
            muted
          />
        </main>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <EphemeralToast toastId={toast?.id ?? null} message={toast?.message ?? null} tone={toast?.tone} />
      </div>
    </div>
  );
}

function TodoSection({
  title,
  countLabel,
  emptyMessage,
  items,
  reduceMotion,
  offset,
  pendingTodoId,
  onClaim,
  onComplete,
  muted = false,
}: {
  title: string;
  countLabel: string;
  emptyMessage: string;
  items: TodoSummary[];
  reduceMotion: boolean;
  offset: number;
  pendingTodoId: number | null;
  onClaim: (todoItemId: number) => Promise<void>;
  onComplete: (todoItemId: number) => Promise<void>;
  muted?: boolean;
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
                <Badge tone={item.statusCode === "COMPLETED" ? "emerald" : item.overdue ? "rose" : "slate"} label={item.overdue ? "지연" : item.statusLabel} />
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
              {item.canClaim || item.canComplete ? (
                <div className="mt-4 flex gap-2">
                  {item.canClaim ? (
                    <button
                      type="button"
                      onClick={() => void onClaim(item.todoItemId)}
                      disabled={pendingTodoId === item.todoItemId}
                      className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {pendingTodoId === item.todoItemId ? "처리 중..." : "내가 맡기"}
                    </button>
                  ) : null}
                  {item.canComplete ? (
                    <button
                      type="button"
                      onClick={() => void onComplete(item.todoItemId)}
                      disabled={pendingTodoId === item.todoItemId}
                      className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#135bec]/90 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {pendingTodoId === item.todoItemId ? "처리 중..." : "완료 처리"}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </motion.article>
          ))
        )}
      </div>
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
