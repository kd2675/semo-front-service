"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AdminMembersLoadingShell } from "../AdminRouteLoadingShells";
import { getClubAdminJoinRequests, getClubAdminMembers } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { adminKeys } from "@/app/lib/queryKeys";
import { ClubAdminMembersClient } from "./ClubAdminMembersClient";

type ClubAdminMembersFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMembersFallbackClient({
  clubId,
}: ClubAdminMembersFallbackClientProps) {
  const router = useRouter();

  const { data: membersPayload, isError: membersError } = useQuery({
    queryKey: adminKeys.members(clubId),
    queryFn: () => unwrap(getClubAdminMembers(clubId)),
  });

  const { data: joinRequestsPayload, isError: joinError } = useQuery({
    queryKey: adminKeys.joinRequests(clubId),
    queryFn: () => unwrap(getClubAdminJoinRequests(clubId)),
  });

  const isAdmin = membersPayload?.admin === true && joinRequestsPayload?.admin === true;

  useEffect(() => {
    if (membersError || joinError) {
      router.replace(`/clubs/${clubId}`);
      return;
    }
    if (membersPayload && joinRequestsPayload && !isAdmin) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [membersError, joinError, membersPayload, joinRequestsPayload, isAdmin, clubId, router]);

  if (!membersPayload || !joinRequestsPayload) {
    return <AdminMembersLoadingShell />;
  }

  return (
    <ClubAdminMembersClient
      clubId={clubId}
      clubName={membersPayload.clubName}
      initialMembers={membersPayload.members}
      initialJoinRequests={joinRequestsPayload.requests}
    />
  );
}
