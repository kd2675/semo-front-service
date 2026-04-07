"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubAdminTodos, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { ApiError } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubAdminTodoClient } from "./ClubAdminTodoClient";

type ClubAdminTodoFallbackClientProps = {
  clubId: string;
};

const DEFAULT_STATUS_FILTER = "ALL";
const DEFAULT_ASSIGNMENT_FILTER = "ALL";
const DEFAULT_APPLICATION_FILTER = "ALL";

export function ClubAdminTodoFallbackClient({ clubId }: ClubAdminTodoFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError, error: clubApiError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
    retry: false,
  });

  const isAdmin = club?.admin === true;

  const { data: todoData, isError: todoError, error: todoApiError, refetch } = useQuery({
    queryKey: adminKeys.todo.list(
      clubId,
      DEFAULT_STATUS_FILTER,
      DEFAULT_ASSIGNMENT_FILTER,
      DEFAULT_APPLICATION_FILTER,
    ),
    queryFn: () =>
      unwrap(getClubAdminTodos(clubId, {
        statusFilter: DEFAULT_STATUS_FILTER,
        assignmentFilter: DEFAULT_ASSIGNMENT_FILTER,
        applicationFilter: DEFAULT_APPLICATION_FILTER,
      })),
    enabled: isAdmin,
    retry: false,
  });

  useEffect(() => {
    if (clubError) {
      const status = clubApiError instanceof ApiError ? clubApiError.status : undefined;
      if (status === 403 || status === 404) {
        router.replace(`/clubs/${clubId}`);
      }
    }
    if (todoError) {
      const status = todoApiError instanceof ApiError ? todoApiError.status : undefined;
      if (status === 403 || status === 404) {
        router.replace(`/clubs/${clubId}/more/todos`);
      }
    }
  }, [clubError, clubApiError, todoError, todoApiError, clubId, router]);

  const errorMessage = clubError
    ? (clubApiError instanceof ApiError ? clubApiError.message : "모임 정보를 다시 불러오지 못했습니다.")
    : todoError
      ? (todoApiError instanceof ApiError ? todoApiError.message : "할 일 운영 정보를 다시 불러오지 못했습니다.")
      : null;

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#f8f6f6] text-slate-900">
        <ClubPageHeader
          title="할 일 관리"
          subtitle={club?.name}
          icon="assignment"
          theme="admin"
          containerClassName="max-w-md"
        />
        <main className="semo-nav-bottom-space mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-4">
          <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">운영 할 일을 불러오지 못했습니다.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{errorMessage}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!club || !todoData) {
    return (
      <div className="min-h-screen bg-[#f8f6f6] text-slate-900">
        <ClubPageHeader
          title="할 일 관리"
          icon="assignment"
          theme="admin"
          containerClassName="max-w-md"
        />
        <main className="semo-nav-bottom-space mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-4">
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
