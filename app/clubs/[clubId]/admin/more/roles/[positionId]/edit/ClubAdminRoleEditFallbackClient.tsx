"use client";

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ClubPositionDetailResponse,
  type UpdateClubPositionRequest,
} from "@/app/lib/clubs";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import {
  deleteRoleMutationOptions,
  updateRoleMutationOptions,
} from "@/app/lib/react-query/roles/mutations";
import { adminRoleDetailQueryOptions } from "@/app/lib/react-query/roles/queries";
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
  const queryClient = useQueryClient();
  const router = useRouter();
  const [payloadState, setPayload] = useState<ClubPositionDetailResponse | null>(null);
  const [clubQuery, detailQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminRoleDetailQueryOptions(clubId, positionId)],
  });
  const club = clubQuery.data ?? null;
  const detailPayload = detailQuery.data ?? null;
  const payload = payloadState ?? detailPayload;
  const updateRoleMutation = useMutation(updateRoleMutationOptions(clubId, positionId));
  const deleteRoleMutation = useMutation(deleteRoleMutationOptions(clubId, positionId));

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !detailQuery.isPending &&
      (clubQuery.isError || detailQuery.isError || !club || !detailPayload || !club.admin)
    ) {
      router.replace(club?.admin === false ? `/clubs/${clubId}` : `/clubs/${clubId}/admin/more/roles`);
    }
  }, [
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    detailPayload,
    detailQuery.isError,
    detailQuery.isPending,
    router,
  ]);

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
        const result = await updateRoleMutation.mutateAsync(request);
        if (!result.ok || !result.data) {
          return { success: false };
        }
        setPayload(result.data);
        await invalidateClubQueries(queryClient, clubId);
        return { success: true };
      }}
      onDelete={async () => {
        const result = await deleteRoleMutation.mutateAsync();
        if (result.ok) {
          await invalidateClubQueries(queryClient, clubId);
        }
        return result.ok;
      }}
    />
  );
}
