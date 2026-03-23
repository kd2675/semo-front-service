"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminRoleManagement,
  getMyClub,
  type ClubAdminRoleManagementResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminRolesClient } from "./ClubAdminRolesClient";

type ClubAdminRolesFallbackClientProps = {
  clubId: string;
};

export function ClubAdminRolesFallbackClient({ clubId }: ClubAdminRolesFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [payload, setPayload] = useState<ClubAdminRoleManagementResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, roleResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminRoleManagement(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!roleResult.ok || !roleResult.data) {
        router.replace(`/clubs/${clubId}/admin`);
        return;
      }

      setClub(clubResult.data);
      setPayload(roleResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !payload) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminRolesClient clubId={clubId} initialData={payload} />;
}
