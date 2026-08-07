"use client";

import { useQuery } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { ClubAdminSettingsClient } from "./ClubAdminSettingsClient";

type ClubAdminSettingsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminSettingsFallbackClient({ clubId }: ClubAdminSettingsFallbackClientProps) {
  const clubQuery = useQuery(myClubQueryOptions(clubId));
  const club = clubQuery.data ?? null;

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="기본 정보"
        heading="관리자 권한이 필요합니다"
        message="클럽 기본 정보는 관리자만 변경할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if (clubQuery.isError && !club) {
    return (
      <ClubRouteErrorState
        title="기본 정보"
        message={getQueryErrorMessage(clubQuery.error, "클럽 정보를 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void clubQuery.refetch()}
      />
    );
  }

  if (!club) {
    return <div className="min-h-screen bg-[var(--background-light)]" aria-busy="true" />;
  }

  return <ClubAdminSettingsClient clubId={clubId} initialClub={club} />;
}
