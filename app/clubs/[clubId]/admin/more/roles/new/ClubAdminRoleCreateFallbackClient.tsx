"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createClubAdminRole,
  getClubAdminRoleManagement,
  getMyClub,
  type ClubAdminRoleManagementResponse,
  type CreateClubPositionRequest,
} from "@/app/lib/clubs";
import { AdminFeatureSettingsLoadingShell } from "../../../AdminRouteLoadingShells";
import { RoleEditorForm } from "../RoleEditorForm";

type ClubAdminRoleCreateFallbackClientProps = {
  clubId: string;
};

export function ClubAdminRoleCreateFallbackClient({
  clubId,
}: ClubAdminRoleCreateFallbackClientProps) {
  const router = useRouter();
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
      setPayload(roleResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!payload) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return (
    <RoleEditorForm
      clubId={clubId}
      clubName={payload.clubName}
      title="직책 생성"
      mode="create"
      permissionGroups={payload.permissionGroups}
      onSubmit={async (value) => {
        const request: CreateClubPositionRequest = {
          displayName: value.displayName,
          positionCode: value.positionCode,
          description: value.description,
          iconName: value.iconName,
          colorHex: value.colorHex,
          permissionKeys: value.permissionKeys,
        };
        const result = await createClubAdminRole(clubId, request);
        if (!result.ok || !result.data) {
          return { success: false };
        }
        return {
          success: true,
          nextHref: `/clubs/${clubId}/admin/more/roles/${result.data.position.clubPositionId}/edit`,
        };
      }}
    />
  );
}
