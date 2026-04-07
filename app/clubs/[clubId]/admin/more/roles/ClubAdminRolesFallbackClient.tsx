"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubAdminRoleManagement, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminRolesClient } from "./ClubAdminRolesClient";

type ClubAdminRolesFallbackClientProps = {
  clubId: string;
};

export function ClubAdminRolesFallbackClient({ clubId }: ClubAdminRolesFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: payload, isError: roleError } = useQuery({
    queryKey: adminKeys.roles.list(clubId),
    queryFn: () => unwrap(getClubAdminRoleManagement(clubId)),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (clubError || (club && !isAdmin)) {
      router.replace(`/clubs/${clubId}`);
    } else if (roleError) {
      router.replace(`/clubs/${clubId}/admin`);
    }
  }, [clubError, club, isAdmin, roleError, clubId, router]);

  if (!club || !payload) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminRolesClient clubId={clubId} initialData={payload} />;
}
