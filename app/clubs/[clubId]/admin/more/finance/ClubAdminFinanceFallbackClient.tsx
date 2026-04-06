"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminFinance,
  getClubAdminFinanceExpenses,
  getClubAdminFinanceObligations,
  getClubAdminFinanceRequests,
  getMyClub,
  type ClubAdminFinanceHomeResponse,
  type ClubAdminFinanceObligationFeedResponse,
  type ClubFinanceExpenseFeedResponse,
  type ClubFinanceRequestFeedResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubAdminFinanceClient } from "./ClubAdminFinanceClient";
import { AdminAttendanceLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminFinanceFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFinanceFallbackClient({ clubId }: ClubAdminFinanceFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [finance, setFinance] = useState<ClubAdminFinanceHomeResponse | null>(null);
  const [obligationFeed, setObligationFeed] = useState<ClubAdminFinanceObligationFeedResponse | null>(null);
  const [requestFeed, setRequestFeed] = useState<ClubFinanceRequestFeedResponse | null>(null);
  const [expenseFeed, setExpenseFeed] = useState<ClubFinanceExpenseFeedResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, financeResult, obligationFeedResult, requestFeedResult, expenseFeedResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminFinance(clubId),
        getClubAdminFinanceObligations(clubId, { size: 10 }),
        getClubAdminFinanceRequests(clubId),
        getClubAdminFinanceExpenses(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }
      if (
        !financeResult.ok ||
        !financeResult.data ||
        !obligationFeedResult.ok ||
        !obligationFeedResult.data
      ) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      setClub(clubResult.data);
      setFinance(financeResult.data);
      setObligationFeed(obligationFeedResult.data);
      setRequestFeed(
        requestFeedResult.ok && requestFeedResult.data
          ? requestFeedResult.data
          : {
              clubId: financeResult.data.clubId,
              clubName: financeResult.data.clubName,
              items: [],
            },
      );
      setExpenseFeed(
        expenseFeedResult.ok && expenseFeedResult.data
          ? expenseFeedResult.data
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
