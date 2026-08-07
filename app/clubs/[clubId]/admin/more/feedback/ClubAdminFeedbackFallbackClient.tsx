"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
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

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="피드백 관리"
        heading="관리자 권한이 필요합니다"
        message="피드백 관리는 클럽 관리자만 사용할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if ((clubQuery.isError || feedbackHomeQuery.isError) && (!club || !feedbackHome)) {
    return (
      <ClubRouteErrorState
        title="피드백 관리"
        message={getQueryErrorMessage(clubQuery.error ?? feedbackHomeQuery.error, "피드백을 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void Promise.all([clubQuery.refetch(), feedbackHomeQuery.refetch()])}
      />
    );
  }

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
