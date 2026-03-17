"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAttendance,
  getMyClub,
  type ClubAttendanceResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubAttendanceClient } from "./ClubAttendanceClient";

type ClubAttendanceFallbackClientProps = {
  clubId: string;
};

export function ClubAttendanceFallbackClient({
  clubId,
}: ClubAttendanceFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [attendance, setAttendance] = useState<ClubAttendanceResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, attendanceResult] = await Promise.all([
        getMyClub(clubId),
        getClubAttendance(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !attendanceResult.ok || !attendanceResult.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      setClub(clubResult.data);
      setAttendance(attendanceResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !attendance) {
    return (
      <div className="bg-[var(--background-light)] text-slate-900 antialiased">
        <div className="relative min-h-screen overflow-x-hidden">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-md items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded-full bg-slate-200" />
                  <div className="h-3 w-20 rounded-full bg-slate-100" />
                </div>
              </div>
              <div className="size-6 rounded-full bg-slate-200" />
            </div>
          </header>

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
