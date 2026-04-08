"use client";

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { type CreateClubPositionRequest } from "@/app/lib/clubs";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { createRoleMutationOptions } from "@/app/lib/react-query/roles/mutations";
import { adminRoleManagementQueryOptions } from "@/app/lib/react-query/roles/queries";
import { AdminFeatureSettingsLoadingShell } from "../../../AdminRouteLoadingShells";
import { RoleEditorForm } from "../RoleEditorForm";

type ClubAdminRoleCreateFallbackClientProps = {
  clubId: string;
};

export function ClubAdminRoleCreateFallbackClient({
  clubId,
}: ClubAdminRoleCreateFallbackClientProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [clubQuery, payloadQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminRoleManagementQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const payload = payloadQuery.data ?? null;
  const createRoleMutation = useMutation(createRoleMutationOptions(clubId));

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
        const result = await createRoleMutation.mutateAsync(request);
        if (!result.ok || !result.data) {
          return { success: false };
        }
        await invalidateClubQueries(queryClient, clubId);
        return {
          success: true,
          nextHref: `/clubs/${clubId}/admin/more/roles/${result.data.position.clubPositionId}/edit`,
        };
      }}
    />
  );
}
