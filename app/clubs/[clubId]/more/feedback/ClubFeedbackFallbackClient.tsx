"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import {
  feedbackDetailFallbackQueryOptions,
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
  const router = useRouter();
  const [clubQuery, feedbackHomeQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), feedbackHomeQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const feedbackHome = feedbackHomeQuery.data ?? null;
  const firstFeedbackId = feedbackHome?.items[0]?.feedbackId ?? null;
  const [initialDetailQuery] = useQueries({
    queries: [
      {
        ...feedbackDetailFallbackQueryOptions(clubId, firstFeedbackId as number),
        enabled: firstFeedbackId != null,
      },
    ],
  });
  const initialDetail = initialDetailQuery.data ?? null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !feedbackHomeQuery.isPending &&
      (clubQuery.isError || feedbackHomeQuery.isError || !club || !feedbackHome)
    ) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    feedbackHome,
    feedbackHomeQuery.isError,
    feedbackHomeQuery.isPending,
    router,
  ]);

  if (!club || !feedbackHome) {
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
