"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import {
  feedbackDetailQueryOptions,
  feedbackHomeQueryOptions,
} from "@/app/lib/react-query/feedback/queries";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubFeedbackClient } from "./ClubFeedbackClient";

type ClubFeedbackFallbackClientProps = {
  clubId: string;
};

export function ClubFeedbackFallbackClient({
  clubId,
}: ClubFeedbackFallbackClientProps) {
  const [clubQuery, feedbackHomeQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), feedbackHomeQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const feedbackHome = feedbackHomeQuery.data ?? null;
  const firstFeedbackId = feedbackHome?.items[0]?.feedbackId ?? null;
  const [initialDetailQuery] = useQueries({
    queries: [
      {
        ...feedbackDetailQueryOptions(clubId, firstFeedbackId as number),
        enabled: firstFeedbackId != null,
      },
    ],
  });
  const initialDetail = initialDetailQuery.data ?? null;

  const error = clubQuery.error ?? feedbackHomeQuery.error ?? initialDetailQuery.error;

  if (
    (clubQuery.isError || feedbackHomeQuery.isError || initialDetailQuery.isError)
    && (!club || !feedbackHome || (firstFeedbackId != null && !initialDetail))
  ) {
    return (
      <ClubRouteErrorState
        title="피드백"
        message={getQueryErrorMessage(error, "피드백을 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}`}
        onRetry={() => void Promise.all([
          clubQuery.refetch(),
          feedbackHomeQuery.refetch(),
          initialDetailQuery.refetch(),
        ])}
      />
    );
  }

  if (!club || !feedbackHome || (firstFeedbackId != null && !initialDetail)) {
    return <ClubTimelineLoadingShell />;
  }

  return (
    <ClubFeedbackClient
      clubId={clubId}
      initialData={feedbackHome}
      initialDetail={initialDetail}
      isAdmin={club.admin}
    />
  );
}
