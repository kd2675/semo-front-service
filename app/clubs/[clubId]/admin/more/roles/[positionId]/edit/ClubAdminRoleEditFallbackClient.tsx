"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  deleteClubAdminRole,
  getClubAdminRoleDetail,
  getMyClub,
  updateClubAdminRole,
  type ClubPositionDetailResponse,
  type UpdateClubPositionRequest,
} from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";
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
  const [localPayload, setLocalPayload] = useState<ClubPositionDetailResponse | null>(null);

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: detail, isError: detailError } = useQuery({
    queryKey: adminKeys.roles.detail(clubId, positionId),
    queryFn: () => unwrap(getClubAdminRoleDetail(clubId, positionId)),
    enabled: isAdmin,
  });

  const payload = localPayload ?? detail ?? null;

  useEffect(() => {
    if (clubError || (club && !isAdmin)) {
      router.replace(`/clubs/${clubId}`);
    } else if (detailError) {
      router.replace(`/clubs/${clubId}/admin/more/roles`);
    }
  }, [clubError, club, isAdmin, detailError, clubId, router]);

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
        setLocalPayload(result.data);
        return { success: true };
      }}
      onDelete={async () => {
        const result = await deleteClubAdminRole(clubId, positionId);
        return result.ok;
      }}
    />
  );
}
