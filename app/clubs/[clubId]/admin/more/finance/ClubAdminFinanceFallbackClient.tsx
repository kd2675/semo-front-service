"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  getClubAdminFinance,
  getClubAdminFinanceExpenses,
  getClubAdminFinanceObligations,
  getClubAdminFinanceRequests,
  getMyClub,
} from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";
import { ClubAdminFinanceClient } from "./ClubAdminFinanceClient";
import { AdminAttendanceLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminFinanceFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFinanceFallbackClient({ clubId }: ClubAdminFinanceFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: finance, isError: financeError } = useQuery({
    queryKey: adminKeys.finance.home(clubId),
    queryFn: () => unwrap(getClubAdminFinance(clubId)),
    enabled: isAdmin,
  });

  const { data: obligationFeed, isError: obligationError } = useQuery({
    queryKey: adminKeys.finance.obligations(clubId),
    queryFn: () => unwrap(getClubAdminFinanceObligations(clubId, { size: 10 })),
    enabled: isAdmin,
  });

  const { data: requestFeed = { clubId: Number(clubId), clubName: finance?.clubName ?? "", items: [] }, isError: requestFeedError } = useQuery({
    queryKey: adminKeys.finance.requests(clubId),
    queryFn: () => unwrap(getClubAdminFinanceRequests(clubId)),
    enabled: !!finance,
    retry: 1,
  });

  const { data: expenseFeed = { clubId: Number(clubId), clubName: finance?.clubName ?? "", items: [] }, isError: expenseFeedError } = useQuery({
    queryKey: adminKeys.finance.expenses(clubId),
    queryFn: () => unwrap(getClubAdminFinanceExpenses(clubId)),
    enabled: !!finance,
    retry: 1,
  });

  useEffect(() => {
    if (clubError || (club && !isAdmin)) {
      router.replace(`/clubs/${clubId}`);
    } else if (financeError || obligationError) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [clubError, club, isAdmin, financeError, obligationError, clubId, router]);

  if (!club || !finance || !obligationFeed) {
    return <AdminAttendanceLoadingShell />;
  }

  return (
    <>
      {requestFeedError || expenseFeedError ? (
        <div className="mx-auto max-w-md px-4 pt-2">
          <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
            일부 데이터를 불러오지 못했습니다. 새로고침하면 다시 시도합니다.
          </div>
        </div>
      ) : null}
      <ClubAdminFinanceClient
        clubId={clubId}
        initialData={finance}
        initialObligationFeed={obligationFeed}
        initialRequestFeed={requestFeed}
        initialExpenseFeed={expenseFeed}
      />
    </>
  );
}
