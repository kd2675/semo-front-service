"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { memberActivityQueryOptions } from "@/app/lib/react-query/activities/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { ClubFeedLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubMemberActivityClient } from "./ClubMemberActivityClient";

type ClubMemberActivityFallbackClientProps = {
  clubId: string;
};

export function ClubMemberActivityFallbackClient({
  clubId,
}: ClubMemberActivityFallbackClientProps) {
  const [clubQuery, activityQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), memberActivityQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const activity = activityQuery.data ?? null;

  const error = clubQuery.error ?? activityQuery.error;

  if ((clubQuery.isError || activityQuery.isError) && (!club || !activity)) {
    return (
      <ClubRouteErrorState
        title="내 활동 기록"
        message={getQueryErrorMessage(error, "활동 기록을 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}`}
        onRetry={() => void Promise.all([clubQuery.refetch(), activityQuery.refetch()])}
      />
    );
  }

  if (!club || !activity) {
    return <ClubFeedLoadingShell />;
  }

  return (
    <ClubMemberActivityClient
      clubId={clubId}
      initialData={activity}
      isAdmin={club.admin}
    />
  );
}
