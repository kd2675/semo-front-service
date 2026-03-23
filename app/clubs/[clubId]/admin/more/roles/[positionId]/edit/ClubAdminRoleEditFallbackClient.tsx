"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteClubAdminRole,
  getClubAdminRoleDetail,
  getMyClub,
  updateClubAdminRole,
  type ClubPositionDetailResponse,
  type UpdateClubPositionRequest,
} from "@/app/lib/clubs";
import { AdminFeatureSettingsLoadingShell } from "../../../../AdminRouteLoadingShells";
import { RoleEditorForm } from "../../RoleEditorForm";

type ClubAdminRoleEditFallbackClientProps = {
  clubId: string;
  positionId: string;
};

export function ClubAdminRoleEditFallbackClient({
  clubId,
  positionId,
}: ClubAdminRoleEditFallbackClientProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<ClubPositionDetailResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, detailResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminRoleDetail(clubId, positionId),
      ]);
      if (cancelled) {
        return;
      }
      if (!clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }
      if (!detailResult.ok || !detailResult.data) {
        router.replace(`/clubs/${clubId}/admin/more/roles`);
        return;
      }
      setPayload(detailResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, positionId, router]);

  if (!payload) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return (
    <RoleEditorForm
      clubId={clubId}
      clubName={payload.clubName}
      title="직책 수정"
      mode="edit"
      permissionGroups={payload.permissionGroups}
      initialPosition={payload.position}
      onSubmit={async (value) => {
        const request: UpdateClubPositionRequest = {
          displayName: value.displayName,
          positionCode: value.positionCode,
          description: value.description,
          iconName: value.iconName,
          colorHex: value.colorHex,
          active: value.active,
          permissionKeys: value.permissionKeys,
        };
        const result = await updateClubAdminRole(clubId, positionId, request);
        if (!result.ok || !result.data) {
          return { success: false };
        }
        setPayload(result.data);
        return { success: true };
      }}
      onDelete={async () => {
        const result = await deleteClubAdminRole(clubId, positionId);
        return result.ok;
      }}
    />
  );
}
