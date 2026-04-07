"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  getClubFinance,
  getClubFinanceRequests,
  getMyClub,
} from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubFinanceClient } from "./ClubFinanceClient";

type ClubFinanceFallbackClientProps = {
  clubId: string;
};

export function ClubFinanceFallbackClient({ clubId }: ClubFinanceFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const { data: finance, isError: financeError } = useQuery({
    queryKey: clubKeys.finance.home(clubId),
    queryFn: () => unwrap(getClubFinance(clubId)),
  });

  const { data: requestFeed = { clubId: Number(clubId), clubName: finance?.clubName ?? "", items: [] }, isError: requestFeedError } = useQuery({
    queryKey: clubKeys.finance.requests(clubId),
    queryFn: () => unwrap(getClubFinanceRequests(clubId)),
    enabled: !!finance,
    retry: 1,
  });

  useEffect(() => {
    if (clubError || financeError) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [clubError, financeError, clubId, router]);

  if (!club || !finance) {
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
    <>
      {requestFeedError ? (
        <div className="mx-auto max-w-md px-4 pt-2">
          <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
            일부 데이터를 불러오지 못했습니다. 새로고침하면 다시 시도합니다.
          </div>
        </div>
      ) : null}
      <ClubFinanceClient
        clubId={clubId}
        initialData={finance}
        initialRequestFeed={requestFeed}
        isAdmin={club.admin}
      />
    </>
  );
}
