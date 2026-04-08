"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminMembersLoadingShell } from "../AdminRouteLoadingShells";
import {
  adminJoinRequestsQueryOptions,
  adminMembersQueryOptions,
} from "@/app/lib/react-query/members/queries";
import { ClubAdminMembersClient } from "./ClubAdminMembersClient";

type ClubAdminMembersFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMembersFallbackClient({
  clubId,
}: ClubAdminMembersFallbackClientProps) {
  const router = useRouter();
  const [membersQuery, joinRequestsQuery] = useQueries({
    queries: [adminMembersQueryOptions(clubId), adminJoinRequestsQueryOptions(clubId)],
  });
  const payload = membersQuery.data ?? null;
  const joinRequestsPayload = joinRequestsQuery.data ?? null;

  useEffect(() => {
    if (
      !membersQuery.isPending &&
      !joinRequestsQuery.isPending &&
      (membersQuery.isError ||
        joinRequestsQuery.isError ||
        !payload ||
        !joinRequestsPayload ||
        !payload.admin ||
        !joinRequestsPayload.admin)
    ) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [
    clubId,
    joinRequestsPayload,
    joinRequestsQuery.isError,
    joinRequestsQuery.isPending,
    membersQuery.isError,
    membersQuery.isPending,
    payload,
    router,
  ]);

  if (!payload || !joinRequestsPayload) {
    return <AdminMembersLoadingShell />;
  }

  return (
    <ClubAdminMembersClient
      clubId={clubId}
      clubName={payload.clubName}
      initialMembers={payload.members}
      initialJoinRequests={joinRequestsPayload.requests}
    />
  );
}
