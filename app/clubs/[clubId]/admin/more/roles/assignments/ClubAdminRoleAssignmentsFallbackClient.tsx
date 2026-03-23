"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminMembers,
  getMyClub,
  type ClubAdminMembersResponse,
} from "@/app/lib/clubs";
import { AdminFeatureSettingsLoadingShell } from "../../../AdminRouteLoadingShells";
import { ClubAdminRoleAssignmentsClient } from "./ClubAdminRoleAssignmentsClient";

type ClubAdminRoleAssignmentsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminRoleAssignmentsFallbackClient({
  clubId,
}: ClubAdminRoleAssignmentsFallbackClientProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<ClubAdminMembersResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, memberResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminMembers(clubId),
      ]);
      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!memberResult.ok || !memberResult.data) {
        router.replace(`/clubs/${clubId}/admin/more/roles`);
        return;
      }

      setPayload(memberResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!payload) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminRoleAssignmentsClient clubId={clubId} initialData={payload} />;
}
