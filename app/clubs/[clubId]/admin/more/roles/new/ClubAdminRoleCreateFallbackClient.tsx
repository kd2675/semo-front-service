"use client";

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { type CreateClubPositionRequest } from "@/app/lib/clubs";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { createRoleMutationOptions } from "@/app/lib/react-query/roles/mutations";
import { adminRoleManagementQueryOptions } from "@/app/lib/react-query/roles/queries";
import { AdminFeatureSettingsLoadingShell } from "../../../AdminRouteLoadingShells";
import { RoleEditorForm } from "../components/RoleEditorForm";

type ClubAdminRoleCreateFallbackClientProps = {
  clubId: string;
};

export function ClubAdminRoleCreateFallbackClient({
  clubId,
}: ClubAdminRoleCreateFallbackClientProps) {
  const queryClient = useQueryClient();
  const [clubQuery, payloadQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminRoleManagementQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const payload = payloadQuery.data ?? null;
  const createRoleMutation = useMutation(createRoleMutationOptions(clubId));

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="직책 생성"
        heading="관리자 권한이 필요합니다"
        message="직책은 클럽 관리자만 만들 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if ((clubQuery.isError || payloadQuery.isError) && (!club || !payload)) {
    return (
      <ClubRouteErrorState
        title="직책 생성"
        message={getQueryErrorMessage(clubQuery.error ?? payloadQuery.error, "직책 생성 정보를 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin/more/roles`}
        theme="admin"
        onRetry={() => void Promise.all([clubQuery.refetch(), payloadQuery.refetch()])}
      />
    );
  }

  if (!club || !payload) {
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
