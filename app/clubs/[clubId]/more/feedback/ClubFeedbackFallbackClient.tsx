"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubFeedbackDetail,
  getClubFeedbackHome,
  getMyClub,
  type ClubFeedbackDetailResponse,
  type ClubFeedbackHomeResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubFeedbackClient } from "./ClubFeedbackClient";

type ClubFeedbackFallbackClientProps = {
  clubId: string;
};

export function ClubFeedbackFallbackClient({
  clubId,
}: ClubFeedbackFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [feedbackHome, setFeedbackHome] = useState<ClubFeedbackHomeResponse | null>(null);
  const [initialDetail, setInitialDetail] = useState<ClubFeedbackDetailResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, feedbackResult] = await Promise.all([
        getMyClub(clubId),
        getClubFeedbackHome(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !feedbackResult.ok || !feedbackResult.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      const firstFeedbackId = feedbackResult.data.items[0]?.feedbackId;
      const detailResult =
        firstFeedbackId == null ? null : await getClubFeedbackDetail(clubId, firstFeedbackId);
      if (cancelled) {
        return;
      }

      setClub(clubResult.data);
      setFeedbackHome(feedbackResult.data);
      setInitialDetail(detailResult?.ok && detailResult.data ? detailResult.data : null);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

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
