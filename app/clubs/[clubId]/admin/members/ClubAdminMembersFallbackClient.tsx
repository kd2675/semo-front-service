"use client";

import { useQueries } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { AdminMembersLoadingShell } from "../AdminRouteLoadingShells";
import { adminMembersQueryOptions } from "@/app/lib/react-query/members/queries";
import { ClubAdminMembersClient } from "./ClubAdminMembersClient";

type ClubAdminMembersFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMembersFallbackClient({
  clubId,
}: ClubAdminMembersFallbackClientProps) {
  const [membersQuery] = useQueries({
    queries: [adminMembersQueryOptions(clubId)],
  });
  const payload = membersQuery.data ?? null;

  if (payload && !payload.admin) {
    return (
      <ClubRouteErrorState
        title="회원 관리"
        heading="관리자 권한이 필요합니다"
        message="회원 관리는 클럽 관리자만 사용할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if (membersQuery.isError && !payload) {
    return (
      <ClubRouteErrorState
        title="회원 관리"
        message={getQueryErrorMessage(membersQuery.error, "회원 목록을 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void membersQuery.refetch()}
      />
    );
  }

  if (!payload) {
    return <AdminMembersLoadingShell />;
  }

  return (
    <ClubAdminMembersClient
      clubId={clubId}
      clubName={payload.clubName}
      initialMembers={payload.members}
    />
  );
}
