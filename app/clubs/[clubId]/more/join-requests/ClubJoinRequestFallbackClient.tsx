"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubJoinRequestInboxClient } from "@/app/components/ClubJoinRequestInboxClient";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { joinRequestInboxQueryOptions } from "@/app/lib/react-query/members/queries";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";

type ClubJoinRequestFallbackClientProps = {
  clubId: string;
};

export function ClubJoinRequestFallbackClient({
  clubId,
}: ClubJoinRequestFallbackClientProps) {
  const [clubQuery, joinRequestQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), joinRequestInboxQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const joinRequestInbox = joinRequestQuery.data ?? null;

  const error = clubQuery.error ?? joinRequestQuery.error;

  if ((clubQuery.isError || joinRequestQuery.isError) && (!club || !joinRequestInbox)) {
    return (
      <ClubRouteErrorState
        title="가입 신청"
        message={getQueryErrorMessage(error, "가입 신청 정보를 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}`}
        onRetry={() => void Promise.all([clubQuery.refetch(), joinRequestQuery.refetch()])}
      />
    );
  }

  if (!club || !joinRequestInbox) {
    return <ClubTimelineLoadingShell />;
  }

  return (
    <ClubJoinRequestInboxClient
      clubId={clubId}
      initialData={joinRequestInbox}
      mode="user"
    />
  );
}
