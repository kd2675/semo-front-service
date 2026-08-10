"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { adminTodosQueryOptions } from "@/app/lib/react-query/todos/queries";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { ClubAdminTodoClient } from "./ClubAdminTodoClient";

type ClubAdminTodoFallbackClientProps = {
  clubId: string;
};

export function ClubAdminTodoFallbackClient({ clubId }: ClubAdminTodoFallbackClientProps) {
  const [clubQuery, todoQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminTodosQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const todoData = todoQuery.data ?? null;
  const errorMessage =
    !clubQuery.isPending && clubQuery.isError
      ? getQueryErrorMessage(clubQuery.error, "모임 정보를 다시 불러오지 못했습니다.")
      : !todoQuery.isPending && todoQuery.isError
        ? getQueryErrorMessage(todoQuery.error, "할 일 운영 정보를 다시 불러오지 못했습니다.")
        : null;

  if (errorMessage) {
    return (
      <ClubRouteErrorState
        title="할 일 관리"
        message={errorMessage}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void Promise.all([clubQuery.refetch(), todoQuery.refetch()])}
      />
    );
  }

  if (!club || !todoData) {
    return (
      <div className="min-h-screen bg-[#f8f6f6] text-slate-900">
        <ClubPageHeader
          title="할 일 관리"
          icon="assignment"
          theme="admin"
          containerClassName="semo-page-admin"
        />
        <main className="semo-page-admin semo-nav-bottom-space flex flex-col gap-4 px-4 pt-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="h-3 w-16 rounded-full bg-slate-100" />
            <div className="mt-3 h-6 w-44 rounded-full bg-slate-200" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="h-3 w-12 rounded-full bg-slate-200" />
                <div className="mt-2 h-4 w-10 rounded-full bg-slate-100" />
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="h-3 w-12 rounded-full bg-slate-200" />
                <div className="mt-2 h-4 w-10 rounded-full bg-slate-100" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <ClubAdminTodoClient clubId={clubId} initialData={todoData} />;
}
