"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import {
  adminFinanceExpensesQueryOptions,
  adminFinanceHomeQueryOptions,
  adminFinanceOperationsQueryOptions,
  adminFinanceObligationsQueryOptions,
  adminFinanceRequestsQueryOptions,
} from "@/app/lib/react-query/finance/queries";
import { ClubAdminFinanceClient } from "./ClubAdminFinanceClient";
import { AdminFinanceLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminFinanceFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFinanceFallbackClient({ clubId }: ClubAdminFinanceFallbackClientProps) {
  const [clubQuery, financeQuery, operationsQuery, obligationFeedQuery, requestFeedQuery, expenseFeedQuery] = useQueries({
    queries: [
      myClubQueryOptions(clubId),
      adminFinanceHomeQueryOptions(clubId),
      adminFinanceOperationsQueryOptions(clubId),
      adminFinanceObligationsQueryOptions(clubId, { size: 10 }),
      adminFinanceRequestsQueryOptions(clubId),
      adminFinanceExpensesQueryOptions(clubId),
    ],
  });
  const club = clubQuery.data ?? null;
  const finance = financeQuery.data ?? null;
  const operations = operationsQuery.data ?? null;
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

  const error = clubQuery.error
    ?? financeQuery.error
    ?? operationsQuery.error
    ?? obligationFeedQuery.error
    ?? requestFeedQuery.error
    ?? expenseFeedQuery.error;
  if (
    (clubQuery.isError
      || financeQuery.isError
      || operationsQuery.isError
      || obligationFeedQuery.isError
      || requestFeedQuery.isError
      || expenseFeedQuery.isError)
    && (!club || !finance || !operations || !obligationFeed || !requestFeed || !expenseFeed)
  ) {
    return (
      <ClubRouteErrorState
        title="재정 관리"
        message={getQueryErrorMessage(error, "재정 운영 정보를 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void Promise.all([
          clubQuery.refetch(),
          financeQuery.refetch(),
          operationsQuery.refetch(),
          obligationFeedQuery.refetch(),
          requestFeedQuery.refetch(),
          expenseFeedQuery.refetch(),
        ])}
      />
    );
  }

  if (!club || !finance || !operations || !obligationFeed || !requestFeed || !expenseFeed) {
    return <AdminFinanceLoadingShell />;
  }

  return (
    <ClubAdminFinanceClient
      clubId={clubId}
      initialData={finance}
      initialOperations={operations}
      initialObligationFeed={obligationFeed}
      initialRequestFeed={requestFeed}
      initialExpenseFeed={expenseFeed}
    />
  );
}
