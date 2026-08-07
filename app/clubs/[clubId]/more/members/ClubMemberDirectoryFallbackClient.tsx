"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { memberDirectoryQueryOptions } from "@/app/lib/react-query/members/queries";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubMemberDirectoryClient } from "./ClubMemberDirectoryClient";

type ClubMemberDirectoryFallbackClientProps = {
  clubId: string;
};

export function ClubMemberDirectoryFallbackClient({
  clubId,
}: ClubMemberDirectoryFallbackClientProps) {
  const [clubQuery, directoryQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), memberDirectoryQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const directory = directoryQuery.data ?? null;

  const error = clubQuery.error ?? directoryQuery.error;

  if ((clubQuery.isError || directoryQuery.isError) && (!club || !directory)) {
    return (
      <ClubRouteErrorState
        title="회원 디렉터리"
        message={getQueryErrorMessage(error, "회원 정보를 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}`}
        onRetry={() => void Promise.all([clubQuery.refetch(), directoryQuery.refetch()])}
      />
    );
  }

  if (!club || !directory) {
    return <ClubTimelineLoadingShell />;
  }

  return (
    <ClubMemberDirectoryClient
      clubId={clubId}
      initialData={directory}
      isAdmin={club.admin}
    />
  );
}
