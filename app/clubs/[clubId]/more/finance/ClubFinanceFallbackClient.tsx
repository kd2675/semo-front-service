"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import {
  financeHomeQueryOptions,
  financeRequestsQueryOptions,
} from "@/app/lib/react-query/finance/queries";
import { ClubFinanceClient } from "./ClubFinanceClient";

type ClubFinanceFallbackClientProps = {
  clubId: string;
};

export function ClubFinanceFallbackClient({ clubId }: ClubFinanceFallbackClientProps) {
  const [clubQuery, financeQuery, requestFeedQuery] = useQueries({
    queries: [
      myClubQueryOptions(clubId),
      financeHomeQueryOptions(clubId),
      financeRequestsQueryOptions(clubId),
    ],
  });
  const club = clubQuery.data ?? null;
  const finance = financeQuery.data ?? null;
  const requestFeed =
    requestFeedQuery.data && finance
      ? {
          ...requestFeedQuery.data,
          clubId: requestFeedQuery.data.clubId || finance.clubId,
          clubName: requestFeedQuery.data.clubName || finance.clubName,
        }
      : null;

  const error = clubQuery.error ?? financeQuery.error ?? requestFeedQuery.error;

  if (
    (clubQuery.isError || financeQuery.isError || requestFeedQuery.isError)
    && (!club || !finance || !requestFeed)
  ) {
    return (
      <ClubRouteErrorState
        title="내 재정"
        message={getQueryErrorMessage(error, "재정 정보를 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}`}
        onRetry={() => void Promise.all([
          clubQuery.refetch(),
          financeQuery.refetch(),
          requestFeedQuery.refetch(),
        ])}
      />
    );
  }

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
