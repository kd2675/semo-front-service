"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminTodos,
  getMyClub,
  type ClubAdminTodoResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubAdminTodoClient } from "./ClubAdminTodoClient";

type ClubAdminTodoFallbackClientProps = {
  clubId: string;
};

export function ClubAdminTodoFallbackClient({ clubId }: ClubAdminTodoFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [todoData, setTodoData] = useState<ClubAdminTodoResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setErrorMessage(null);
      const [clubResult, todoResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminTodos(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data) {
        if (clubResult.status === 403 || clubResult.status === 404) {
          router.replace(`/clubs/${clubId}`);
          return;
        }
        setClub(null);
        setTodoData(null);
        setErrorMessage(clubResult.message ?? "모임 정보를 다시 불러오지 못했습니다.");
        return;
      }
      setClub(clubResult.data);

      if (!todoResult.ok || !todoResult.data) {
        if (todoResult.status === 403 || todoResult.status === 404) {
          router.replace(`/clubs/${clubId}/more/todos`);
          return;
        }
        setTodoData(null);
        setErrorMessage(todoResult.message ?? "할 일 운영 정보를 다시 불러오지 못했습니다.");
        return;
      }

      setTodoData(todoResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, reloadKey, router]);

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
              onClick={() => setReloadKey((current) => current + 1)}
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
