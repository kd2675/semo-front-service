"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { adminRoleManagementQueryOptions } from "@/app/lib/react-query/roles/queries";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminRolesClient } from "./ClubAdminRolesClient";

type ClubAdminRolesFallbackClientProps = {
  clubId: string;
};

export function ClubAdminRolesFallbackClient({ clubId }: ClubAdminRolesFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, payloadQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminRoleManagementQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const payload = payloadQuery.data ?? null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !payloadQuery.isPending &&
      (clubQuery.isError || payloadQuery.isError || !club || !payload || !club.admin)
    ) {
      router.replace(club?.admin === false ? `/clubs/${clubId}` : `/clubs/${clubId}/admin`);
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

  if (!club || !payload) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminRolesClient clubId={clubId} initialData={payload} />;
}
