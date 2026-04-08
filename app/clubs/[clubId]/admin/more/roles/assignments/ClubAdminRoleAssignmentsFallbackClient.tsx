"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { adminMembersQueryOptions } from "@/app/lib/react-query/members/queries";
import { AdminFeatureSettingsLoadingShell } from "../../../AdminRouteLoadingShells";
import { ClubAdminRoleAssignmentsClient } from "./ClubAdminRoleAssignmentsClient";

type ClubAdminRoleAssignmentsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminRoleAssignmentsFallbackClient({
  clubId,
}: ClubAdminRoleAssignmentsFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, payloadQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminMembersQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const payload = payloadQuery.data ?? null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !payloadQuery.isPending &&
      (clubQuery.isError || payloadQuery.isError || !club || !payload || !club.admin)
    ) {
      router.replace(club?.admin === false ? `/clubs/${clubId}` : `/clubs/${clubId}/admin/more/roles`);
    }
  }, [
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    payload,
    payloadQuery.isError,
    payloadQuery.isPending,
    router,
  ]);

  if (!payload) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminRoleAssignmentsClient clubId={clubId} initialData={payload} />;
}
