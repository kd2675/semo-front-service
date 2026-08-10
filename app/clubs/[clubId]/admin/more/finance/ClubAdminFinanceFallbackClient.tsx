"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import {
  adminFinanceExpensesQueryOptions,
  adminFinanceHomeQueryOptions,
  adminFinanceObligationsQueryOptions,
  adminFinanceRequestsQueryOptions,
} from "@/app/lib/react-query/finance/queries";
import { ClubAdminFinanceClient } from "./ClubAdminFinanceClient";
import { AdminAttendanceLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminFinanceFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFinanceFallbackClient({ clubId }: ClubAdminFinanceFallbackClientProps) {
  const [clubQuery, financeQuery, obligationFeedQuery, requestFeedQuery, expenseFeedQuery] = useQueries({
    queries: [
      myClubQueryOptions(clubId),
      adminFinanceHomeQueryOptions(clubId),
      adminFinanceObligationsQueryOptions(clubId, { size: 10 }),
      adminFinanceRequestsQueryOptions(clubId),
      adminFinanceExpensesQueryOptions(clubId),
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

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="재정 관리"
        heading="관리자 권한이 필요합니다"
        message="재정 관리는 클럽 관리자만 사용할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  const error = clubQuery.error
    ?? financeQuery.error
    ?? obligationFeedQuery.error
    ?? requestFeedQuery.error
    ?? expenseFeedQuery.error;
  if (
    (clubQuery.isError
      || financeQuery.isError
      || obligationFeedQuery.isError
      || requestFeedQuery.isError
      || expenseFeedQuery.isError)
    && (!club || !finance || !obligationFeed || !requestFeed || !expenseFeed)
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
          obligationFeedQuery.refetch(),
          requestFeedQuery.refetch(),
          expenseFeedQuery.refetch(),
        ])}
      />
    );
  }

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
