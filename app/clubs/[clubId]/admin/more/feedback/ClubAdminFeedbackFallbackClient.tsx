"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import {
  adminFeedbackDetailFallbackQueryOptions,
  adminFeedbackHomeQueryOptions,
} from "@/app/lib/react-query/feedback/queries";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminFeedbackClient } from "./ClubAdminFeedbackClient";

type ClubAdminFeedbackFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFeedbackFallbackClient({
  clubId,
}: ClubAdminFeedbackFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, feedbackHomeQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminFeedbackHomeQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const feedbackHome = feedbackHomeQuery.data ?? null;
  const firstFeedbackId = feedbackHome?.items[0]?.feedbackId ?? null;
  const [initialDetailQuery] = useQueries({
    queries: [
      {
        ...adminFeedbackDetailFallbackQueryOptions(clubId, firstFeedbackId as number),
        enabled: firstFeedbackId != null,
      },
    ],
  });
  const initialDetail = initialDetailQuery.data ?? null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !feedbackHomeQuery.isPending &&
      (clubQuery.isError || feedbackHomeQuery.isError || !club || !feedbackHome || !club.admin)
    ) {
      router.replace(club?.admin === false ? `/clubs/${clubId}` : `/clubs/${clubId}/admin`);
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
    return <AdminFeatureSettingsLoadingShell />;
  }

  return (
    <ClubAdminFeedbackClient
      clubId={clubId}
      initialData={feedbackHome}
      initialDetail={initialDetail}
    />
  );
}
