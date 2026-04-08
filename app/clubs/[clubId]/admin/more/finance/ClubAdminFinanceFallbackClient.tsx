"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import {
  adminFinanceExpensesFallbackQueryOptions,
  adminFinanceHomeQueryOptions,
  adminFinanceObligationsQueryOptions,
  adminFinanceRequestsFallbackQueryOptions,
} from "@/app/lib/react-query/finance/queries";
import { ClubAdminFinanceClient } from "./ClubAdminFinanceClient";
import { AdminAttendanceLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminFinanceFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFinanceFallbackClient({ clubId }: ClubAdminFinanceFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, financeQuery, obligationFeedQuery, requestFeedQuery, expenseFeedQuery] = useQueries({
    queries: [
      myClubQueryOptions(clubId),
      adminFinanceHomeQueryOptions(clubId),
      adminFinanceObligationsQueryOptions(clubId, { size: 10 }),
      adminFinanceRequestsFallbackQueryOptions(clubId),
      adminFinanceExpensesFallbackQueryOptions(clubId),
    ],
  });
  const club = clubQuery.data ?? null;
  const finance = financeQuery.data ?? null;
  const obligationFeed = obligationFeedQuery.data ?? null;
  const requestFeed =
    requestFeedQuery.data && finance
      ? {
          ...requestFeedQuery.data,
          clubId: requestFeedQuery.data.clubId || finance.clubId,
          clubName: requestFeedQuery.data.clubName || finance.clubName,
        }
      : null;
  const expenseFeed =
    expenseFeedQuery.data && finance
      ? {
          ...expenseFeedQuery.data,
          clubId: expenseFeedQuery.data.clubId || finance.clubId,
          clubName: expenseFeedQuery.data.clubName || finance.clubName,
        }
      : null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !financeQuery.isPending &&
      !obligationFeedQuery.isPending &&
      (clubQuery.isError || financeQuery.isError || obligationFeedQuery.isError || !club || !finance || !obligationFeed)
    ) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    finance,
    financeQuery.isError,
    financeQuery.isPending,
    obligationFeed,
    obligationFeedQuery.isError,
    obligationFeedQuery.isPending,
    router,
  ]);

  if (!club || !finance || !obligationFeed || !requestFeed || !expenseFeed) {
    return <AdminAttendanceLoadingShell />;
  }

  return (
    <ClubAdminFinanceClient
      clubId={clubId}
      initialData={finance}
      initialObligationFeed={obligationFeed}
      initialRequestFeed={requestFeed}
      initialExpenseFeed={expenseFeed}
    />
  );
}
