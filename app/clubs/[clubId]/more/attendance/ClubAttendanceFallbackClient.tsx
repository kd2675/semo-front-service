"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { attendanceQueryOptions } from "@/app/lib/react-query/attendance/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { ClubAttendanceClient } from "./ClubAttendanceClient";

type ClubAttendanceFallbackClientProps = {
  clubId: string;
};

export function ClubAttendanceFallbackClient({
  clubId,
}: ClubAttendanceFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, attendanceQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), attendanceQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const attendance = attendanceQuery.data ?? null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !attendanceQuery.isPending &&
      (clubQuery.isError || attendanceQuery.isError || !club || !attendance)
    ) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [
    attendance,
    attendanceQuery.isError,
    attendanceQuery.isPending,
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    router,
  ]);

  if (!club || !attendance) {
    return (
      <div className="bg-[var(--background-light)] text-slate-900 antialiased">
        <div className="relative min-h-screen">
          <ClubPageHeader
            title="출석 체크"
            icon="fact_check"
            className="bg-white/85 backdrop-blur-md"
          />

          <main className="semo-nav-bottom-space mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-3 w-14 rounded-full bg-slate-100" />
              <div className="mt-3 h-6 w-40 rounded-full bg-slate-200" />
              <div className="mt-2 h-4 w-56 rounded-full bg-slate-100" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="h-3 w-12 rounded-full bg-slate-200" />
                  <div className="mt-2 h-4 w-20 rounded-full bg-slate-100" />
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="h-3 w-14 rounded-full bg-slate-200" />
                  <div className="mt-2 h-4 w-16 rounded-full bg-slate-100" />
                </div>
              </div>
              <div className="mt-5 h-12 rounded-xl bg-slate-200" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-5 w-32 rounded-full bg-slate-200" />
                <div className="h-3 w-16 rounded-full bg-slate-100" />
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="h-4 w-36 rounded-full bg-slate-200" />
                  <div className="mt-2 h-3 w-28 rounded-full bg-slate-100" />
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
                  <div className="h-4 w-32 rounded-full bg-slate-200" />
                  <div className="mt-2 h-3 w-24 rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <ClubAttendanceClient
      clubId={clubId}
      initialData={attendance}
      isAdmin={club.admin}
    />
  );
}
