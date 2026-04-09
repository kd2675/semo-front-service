"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClubJoinRequestInboxClient } from "@/app/components/ClubJoinRequestInboxClient";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { adminJoinRequestInboxQueryOptions } from "@/app/lib/react-query/members/queries";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";

type ClubAdminJoinRequestFallbackClientProps = {
  clubId: string;
};

export function ClubAdminJoinRequestFallbackClient({
  clubId,
}: ClubAdminJoinRequestFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, joinRequestQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminJoinRequestInboxQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const joinRequestInbox = joinRequestQuery.data ?? null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !joinRequestQuery.isPending &&
      (clubQuery.isError ||
        joinRequestQuery.isError ||
        !club ||
        !joinRequestInbox ||
        !club.admin)
    ) {
      router.replace(club?.admin === false ? `/clubs/${clubId}` : `/clubs/${clubId}/admin`);
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
    return <AdminFeatureSettingsLoadingShell />;
  }

  return (
    <ClubJoinRequestInboxClient
      clubId={clubId}
      initialData={joinRequestInbox}
      mode="admin"
    />
  );
}
