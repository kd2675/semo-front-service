"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminMembersLoadingShell } from "../AdminRouteLoadingShells";
import { adminMembersQueryOptions } from "@/app/lib/react-query/members/queries";
import { ClubAdminMembersClient } from "./ClubAdminMembersClient";

type ClubAdminMembersFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMembersFallbackClient({
  clubId,
}: ClubAdminMembersFallbackClientProps) {
  const router = useRouter();
  const [membersQuery] = useQueries({
    queries: [adminMembersQueryOptions(clubId)],
  });
  const payload = membersQuery.data ?? null;

  useEffect(() => {
    if (
      !membersQuery.isPending &&
      (membersQuery.isError ||
        !payload ||
        !payload.admin)
    ) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [
    clubId,
    membersQuery.isError,
    membersQuery.isPending,
    payload,
    router,
  ]);

  if (!payload) {
    return <AdminMembersLoadingShell />;
  }

  return (
    <ClubAdminMembersClient
      clubId={clubId}
      clubName={payload.clubName}
      initialMembers={payload.members}
    />
  );
}
