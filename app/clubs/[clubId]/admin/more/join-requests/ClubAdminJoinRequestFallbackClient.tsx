"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubJoinRequestInboxClient } from "@/app/components/ClubJoinRequestInboxClient";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { adminJoinRequestInboxQueryOptions } from "@/app/lib/react-query/members/queries";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminJoinRequestFallbackClientProps = {
  clubId: string;
};

export function ClubAdminJoinRequestFallbackClient({
  clubId,
}: ClubAdminJoinRequestFallbackClientProps) {
  const [clubQuery, joinRequestQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminJoinRequestInboxQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const joinRequestInbox = joinRequestQuery.data ?? null;

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="가입 신청 관리"
        heading="관리자 권한이 필요합니다"
        message="가입 신청 관리는 클럽 관리자만 사용할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if ((clubQuery.isError || joinRequestQuery.isError) && (!club || !joinRequestInbox)) {
    return (
      <ClubRouteErrorState
        title="가입 신청 관리"
        message={getQueryErrorMessage(clubQuery.error ?? joinRequestQuery.error, "가입 신청을 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void Promise.all([clubQuery.refetch(), joinRequestQuery.refetch()])}
      />
    );
  }

  if (!club || !joinRequestInbox) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return (
    <ClubJoinRequestInboxClient
      clubId={clubId}
      initialData={joinRequestInbox}
    />
  );
}
