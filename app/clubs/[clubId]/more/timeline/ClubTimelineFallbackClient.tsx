"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { timelineQueryOptions } from "@/app/lib/react-query/activities/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubTimelineClient } from "./ClubTimelineClient";

type ClubTimelineFallbackClientProps = {
  clubId: string;
};

export function ClubTimelineFallbackClient({
  clubId,
}: ClubTimelineFallbackClientProps) {
  const [clubQuery, timelineQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), timelineQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const timeline = timelineQuery.data ?? null;

  const error = clubQuery.error ?? timelineQuery.error;

  if ((clubQuery.isError || timelineQuery.isError) && (!club || !timeline)) {
    return (
      <ClubRouteErrorState
        title="활동 타임라인"
        message={getQueryErrorMessage(error, "활동 기록을 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}`}
        onRetry={() => void Promise.all([clubQuery.refetch(), timelineQuery.refetch()])}
      />
    );
  }

  if (!club || !timeline) {
    return <ClubTimelineLoadingShell />;
  }

  return (
    <ClubTimelineClient
      clubId={clubId}
      initialData={timeline}
      isAdmin={club.admin}
    />
  );
}
