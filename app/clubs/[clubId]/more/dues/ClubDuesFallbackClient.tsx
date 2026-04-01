"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubDues,
  getMyClub,
  type ClubDuesHomeResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubDuesClient } from "./ClubDuesClient";

type ClubDuesFallbackClientProps = {
  clubId: string;
};

export function ClubDuesFallbackClient({ clubId }: ClubDuesFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [dues, setDues] = useState<ClubDuesHomeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, duesResult] = await Promise.all([
        getMyClub(clubId),
        getClubDues(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !duesResult.ok || !duesResult.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      setClub(clubResult.data);
      setDues(duesResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !dues) {
    return (
      <div className="bg-[var(--background-light)] text-slate-900 antialiased">
        <div className="relative min-h-screen">
          <ClubPageHeader
            title="회비 관리"
            icon="payments"
            className="bg-white/85 backdrop-blur-md"
          />
          <main className="semo-nav-bottom-space mx-auto flex w-full max-w-md flex-1 flex-col gap-4 px-4 pt-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-3 w-16 rounded-full bg-slate-100" />
              <div className="mt-3 h-6 w-44 rounded-full bg-slate-200" />
              <div className="mt-2 h-4 w-52 rounded-full bg-slate-100" />
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="h-3 w-10 rounded-full bg-slate-200" />
                  <div className="mt-2 h-4 w-12 rounded-full bg-slate-100" />
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="h-3 w-10 rounded-full bg-slate-200" />
                  <div className="mt-2 h-4 w-12 rounded-full bg-slate-100" />
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="h-3 w-10 rounded-full bg-slate-200" />
                  <div className="mt-2 h-4 w-12 rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-5 w-24 rounded-full bg-slate-200" />
              <div className="mt-4 h-20 rounded-2xl bg-slate-50" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-5 w-20 rounded-full bg-slate-200" />
              <div className="mt-4 space-y-3">
                <div className="h-20 rounded-2xl bg-slate-50" />
                <div className="h-20 rounded-2xl bg-slate-50" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return <ClubDuesClient clubId={clubId} initialData={dues} isAdmin={club.admin} />;
}
