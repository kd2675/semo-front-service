"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { adminRoleManagementQueryOptions } from "@/app/lib/react-query/roles/queries";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminRolesClient } from "./ClubAdminRolesClient";

type ClubAdminRolesFallbackClientProps = {
  clubId: string;
};

export function ClubAdminRolesFallbackClient({ clubId }: ClubAdminRolesFallbackClientProps) {
  const [clubQuery, payloadQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminRoleManagementQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const payload = payloadQuery.data ?? null;

  if ((clubQuery.isError || payloadQuery.isError) && (!club || !payload)) {
    return (
      <ClubRouteErrorState
        title="직책·권한"
        message={getQueryErrorMessage(clubQuery.error ?? payloadQuery.error, "직책 정보를 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void Promise.all([clubQuery.refetch(), payloadQuery.refetch()])}
      />
    );
  }

  if (!club || !payload) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminRolesClient clubId={clubId} initialData={payload} />;
}
