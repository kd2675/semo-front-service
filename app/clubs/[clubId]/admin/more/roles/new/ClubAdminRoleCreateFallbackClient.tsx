"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createClubAdminRole,
  getClubAdminRoleManagement,
  getMyClub,
  type CreateClubPositionRequest,
} from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";
import { AdminFeatureSettingsLoadingShell } from "../../../AdminRouteLoadingShells";
import { RoleEditorForm } from "../RoleEditorForm";

type ClubAdminRoleCreateFallbackClientProps = {
  clubId: string;
};

export function ClubAdminRoleCreateFallbackClient({
  clubId,
}: ClubAdminRoleCreateFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: payload, isError: roleError } = useQuery({
    queryKey: adminKeys.roles.management(clubId),
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
