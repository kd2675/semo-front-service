"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubTodos, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubTodoClient } from "./ClubTodoClient";

type ClubTodoFallbackClientProps = {
  clubId: string;
};

export function ClubTodoFallbackClient({ clubId }: ClubTodoFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const { data: todoData, isError: todoError } = useQuery({
    queryKey: clubKeys.todo.list(clubId),
    queryFn: () => unwrap(getClubTodos(clubId)),
  });

  useEffect(() => {
    if (clubError || todoError) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [clubError, todoError, clubId, router]);

  if (!club || !todoData) {
    return (
      <div className="bg-[var(--background-light)] text-slate-900 antialiased">
        <div className="relative min-h-screen">
          <ClubPageHeader
            title="할 일"
            icon="assignment"
            className="bg-white/85 backdrop-blur-md"
          />
          <main className="semo-nav-bottom-space mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-3 w-16 rounded-full bg-slate-100" />
              <div className="mt-3 h-6 w-44 rounded-full bg-slate-200" />
              <div className="mt-2 h-4 w-56 rounded-full bg-slate-100" />
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 h-5 w-28 rounded-full bg-slate-200" />
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 px-4 py-4">
                  <div className="h-4 w-32 rounded-full bg-slate-200" />
                  <div className="mt-2 h-3 w-48 rounded-full bg-slate-100" />
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-4">
                  <div className="h-4 w-28 rounded-full bg-slate-200" />
                  <div className="mt-2 h-3 w-40 rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return <ClubTodoClient clubId={clubId} initialData={todoData} isAdmin={club.admin} />;
}
