"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubAdminFeedback, getClubAdminFeedbackDetail, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminFeedbackClient } from "./ClubAdminFeedbackClient";

type ClubAdminFeedbackFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFeedbackFallbackClient({
  clubId,
}: ClubAdminFeedbackFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: feedbackHome, isError: feedbackError } = useQuery({
    queryKey: adminKeys.feedback.list(clubId),
    queryFn: () => unwrap(getClubAdminFeedback(clubId)),
    enabled: isAdmin,
  });

  const firstFeedbackId = feedbackHome?.items[0]?.feedbackId;

  const { data: initialDetail } = useQuery({
    queryKey: adminKeys.feedback.detail(clubId, String(firstFeedbackId!)),
    queryFn: async () => {
      const result = await getClubAdminFeedbackDetail(clubId, firstFeedbackId!);
      return result.ok && result.data ? result.data : null;
    },
    enabled: firstFeedbackId != null,
  });

  useEffect(() => {
    if (clubError || (club && !isAdmin)) {
      router.replace(`/clubs/${clubId}`);
    } else if (feedbackError) {
      router.replace(`/clubs/${clubId}/admin`);
    }
  }, [clubError, club, isAdmin, feedbackError, clubId, router]);

  if (!club || !feedbackHome) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return (
    <ClubAdminFeedbackClient
      clubId={clubId}
      initialData={feedbackHome}
      initialDetail={initialDetail ?? null}
    />
  );
}
