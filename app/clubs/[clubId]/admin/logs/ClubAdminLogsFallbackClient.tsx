"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminActivitiesQueryOptions } from "@/app/lib/react-query/activities/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { AdminHomeLoadingShell } from "../AdminRouteLoadingShells";
import { ClubAdminLogsClient } from "./ClubAdminLogsClient";

type ClubAdminLogsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminLogsFallbackClient({ clubId }: ClubAdminLogsFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, logsQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminActivitiesQueryOptions(clubId, 20)],
  });
  const club = clubQuery.data ?? null;
  const initialData = logsQuery.data ?? null;

  useEffect(() => {
    if (!clubQuery.isPending && (clubQuery.isError || !club || !club.admin)) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [club, clubId, clubQuery.isError, clubQuery.isPending, router]);

  useEffect(() => {
    if (!logsQuery.isPending && logsQuery.isError) {
        router.replace(`/clubs/${clubId}/admin`);
    }
  }, [clubId, logsQuery.isError, logsQuery.isPending, router]);

  if (!club || !initialData) {
    return <AdminHomeLoadingShell />;
  }

  return <ClubAdminLogsClient clubId={clubId} clubName={club.name} initialData={initialData} />;
}
