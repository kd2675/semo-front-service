"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { adminTimelineQueryOptions } from "@/app/lib/react-query/activities/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { AdminTimelineLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminTimelineClient } from "./ClubAdminTimelineClient";

type ClubAdminTimelineFallbackClientProps = {
  clubId: string;
};

export function ClubAdminTimelineFallbackClient({
  clubId,
}: ClubAdminTimelineFallbackClientProps) {
  const [clubQuery, timelineQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminTimelineQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const timeline = timelineQuery.data ?? null;

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="활동 타임라인 관리"
        heading="관리자 권한이 필요합니다"
        message="활동 타임라인 관리는 클럽 관리자만 사용할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if ((clubQuery.isError || timelineQuery.isError) && (!club || !timeline)) {
    return (
      <ClubRouteErrorState
        title="활동 타임라인 관리"
        message={getQueryErrorMessage(clubQuery.error ?? timelineQuery.error, "활동 기록을 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void Promise.all([clubQuery.refetch(), timelineQuery.refetch()])}
      />
    );
  }

  if (!club || !timeline) {
    return <AdminTimelineLoadingShell />;
  }

  return <ClubAdminTimelineClient clubId={clubId} initialData={timeline} />;
}
