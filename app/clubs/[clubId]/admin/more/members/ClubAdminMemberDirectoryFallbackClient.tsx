"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { adminMemberDirectorySettingsQueryOptions } from "@/app/lib/react-query/members/queries";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminMemberDirectoryClient } from "./ClubAdminMemberDirectoryClient";

type ClubAdminMemberDirectoryFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMemberDirectoryFallbackClient({
  clubId,
}: ClubAdminMemberDirectoryFallbackClientProps) {
  const [clubQuery, directoryQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminMemberDirectorySettingsQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const directory = directoryQuery.data ?? null;

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="회원 디렉터리 관리"
        heading="관리자 권한이 필요합니다"
        message="회원 디렉터리 관리는 클럽 관리자만 사용할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if ((clubQuery.isError || directoryQuery.isError) && (!club || !directory)) {
    return (
      <ClubRouteErrorState
        title="회원 디렉터리 관리"
        message={getQueryErrorMessage(clubQuery.error ?? directoryQuery.error, "회원 디렉터리 설정을 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void Promise.all([clubQuery.refetch(), directoryQuery.refetch()])}
      />
    );
  }

  if (!club || !directory) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminMemberDirectoryClient clubId={clubId} initialData={directory} />;
}
