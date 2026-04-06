"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubFinance,
  getClubFinanceRequests,
  getMyClub,
  type ClubFinanceHomeResponse,
  type ClubFinanceRequestFeedResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubFinanceClient } from "./ClubFinanceClient";

type ClubFinanceFallbackClientProps = {
  clubId: string;
};

export function ClubFinanceFallbackClient({ clubId }: ClubFinanceFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [finance, setFinance] = useState<ClubFinanceHomeResponse | null>(null);
  const [requestFeed, setRequestFeed] = useState<ClubFinanceRequestFeedResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, financeResult, requestResult] = await Promise.all([
        getMyClub(clubId),
        getClubFinance(clubId),
        getClubFinanceRequests(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (
        !clubResult.ok ||
        !clubResult.data ||
        !financeResult.ok ||
        !financeResult.data
      ) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      setClub(clubResult.data);
      setFinance(financeResult.data);
      setRequestFeed(
        requestResult.ok && requestResult.data
          ? requestResult.data
          : {
              clubId: financeResult.data.clubId,
              clubName: financeResult.data.clubName,
              items: [],
            },
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !finance || !requestFeed) {
    return (
      <div className="bg-[var(--background-light)] text-slate-900 antialiased">
        <div className="relative min-h-screen">
          <ClubPageHeader
            title="내 재정"
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

  return (
    <ClubFinanceClient
      clubId={clubId}
      initialData={finance}
      initialRequestFeed={requestFeed}
      isAdmin={club.admin}
    />
  );
}
