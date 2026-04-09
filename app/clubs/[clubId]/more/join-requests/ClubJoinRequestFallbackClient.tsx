"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClubJoinRequestInboxClient } from "@/app/components/ClubJoinRequestInboxClient";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { joinRequestInboxQueryOptions } from "@/app/lib/react-query/members/queries";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";

type ClubJoinRequestFallbackClientProps = {
  clubId: string;
};

export function ClubJoinRequestFallbackClient({
  clubId,
}: ClubJoinRequestFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, joinRequestQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), joinRequestInboxQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const joinRequestInbox = joinRequestQuery.data ?? null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !joinRequestQuery.isPending &&
      (clubQuery.isError || joinRequestQuery.isError || !club || !joinRequestInbox)
    ) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    joinRequestInbox,
    joinRequestQuery.isError,
    joinRequestQuery.isPending,
    router,
  ]);

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
