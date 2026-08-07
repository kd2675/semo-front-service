"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { adminActivitiesQueryOptions } from "@/app/lib/react-query/activities/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { AdminHomeLoadingShell } from "../AdminRouteLoadingShells";
import { ClubAdminLogsClient } from "./ClubAdminLogsClient";

type ClubAdminLogsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminLogsFallbackClient({ clubId }: ClubAdminLogsFallbackClientProps) {
  const [clubQuery, logsQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminActivitiesQueryOptions(clubId, 20)],
  });
  const club = clubQuery.data ?? null;
  const initialData = logsQuery.data ?? null;

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="활동 로그"
        heading="관리자 권한이 필요합니다"
        message="활동 로그는 클럽 관리자만 확인할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if ((clubQuery.isError || logsQuery.isError) && (!club || !initialData)) {
    return (
      <ClubRouteErrorState
        title="활동 로그"
        message={getQueryErrorMessage(clubQuery.error ?? logsQuery.error, "활동 로그를 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void Promise.all([clubQuery.refetch(), logsQuery.refetch()])}
      />
    );
  }

  if (!club || !initialData) {
    return <AdminHomeLoadingShell />;
  }

  return <ClubAdminLogsClient clubId={clubId} clubName={club.name} initialData={initialData} />;
}
