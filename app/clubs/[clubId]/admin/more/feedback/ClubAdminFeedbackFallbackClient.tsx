"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminFeedback,
  getClubAdminFeedbackDetail,
  getMyClub,
  type ClubAdminFeedbackResponse,
  type ClubFeedbackDetailResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminFeedbackClient } from "./ClubAdminFeedbackClient";

type ClubAdminFeedbackFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFeedbackFallbackClient({
  clubId,
}: ClubAdminFeedbackFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [feedbackHome, setFeedbackHome] = useState<ClubAdminFeedbackResponse | null>(null);
  const [initialDetail, setInitialDetail] = useState<ClubFeedbackDetailResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, feedbackResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminFeedback(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!feedbackResult.ok || !feedbackResult.data) {
        router.replace(`/clubs/${clubId}/admin`);
        return;
      }

      const firstFeedbackId = feedbackResult.data.items[0]?.feedbackId;
      const detailResult =
        firstFeedbackId == null ? null : await getClubAdminFeedbackDetail(clubId, firstFeedbackId);
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
