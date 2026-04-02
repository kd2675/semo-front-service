"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminMembersLoadingShell } from "../AdminRouteLoadingShells";
import {
  getClubAdminJoinRequests,
  getClubAdminMembers,
  type ClubAdminJoinRequestsResponse,
  type ClubAdminMembersResponse,
} from "@/app/lib/clubs";
import { ClubAdminMembersClient } from "./ClubAdminMembersClient";

type ClubAdminMembersFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMembersFallbackClient({
  clubId,
}: ClubAdminMembersFallbackClientProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<ClubAdminMembersResponse | null>(null);
  const [joinRequestsPayload, setJoinRequestsPayload] = useState<ClubAdminJoinRequestsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [membersResult, joinRequestsResult] = await Promise.all([
        getClubAdminMembers(clubId),
        getClubAdminJoinRequests(clubId),
      ]);
      if (cancelled) {
        return;
      }
      if (
        !membersResult.ok ||
        !membersResult.data ||
        !membersResult.data.admin ||
        !joinRequestsResult.ok ||
        !joinRequestsResult.data ||
        !joinRequestsResult.data.admin
      ) {
        router.replace(`/clubs/${clubId}`);
        return;
      }
      setPayload(membersResult.data);
      setJoinRequestsPayload(joinRequestsResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

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
