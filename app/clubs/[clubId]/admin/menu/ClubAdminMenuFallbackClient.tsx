"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { AdminMenuLoadingShell } from "../AdminRouteLoadingShells";
import { ClubAdminMenuClient } from "./ClubAdminMenuClient";
import {
  clubFeaturesQueryOptions,
  myClubQueryOptions,
  clubQueryKeys,
} from "@/app/lib/react-query/club/queries";

type ClubAdminMenuFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMenuFallbackClient({ clubId }: ClubAdminMenuFallbackClientProps) {
  const queryClient = useQueryClient();
  const {
    data: club,
    isPending: isClubPending,
    isError: isClubError,
    error: clubError,
    refetch: refetchClub,
  } = useQuery(myClubQueryOptions(clubId));
  const featuresQuery = useQuery(clubFeaturesQueryOptions(clubId));
  const features = featuresQuery.data ?? [];

  useEffect(() => {
    const onFeatureUpdate = () => {
      void queryClient.invalidateQueries({
        queryKey: clubQueryKeys.features(clubId),
      });
    };

    window.addEventListener("semo:club-features-updated", onFeatureUpdate);

    return () => {
      window.removeEventListener("semo:club-features-updated", onFeatureUpdate);
    };
  }, [clubId, queryClient]);

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="기능 설정"
        heading="관리자 권한이 필요합니다"
        message="클럽 기능 설정은 관리자만 변경할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if ((isClubError || featuresQuery.isError) && (!club || !featuresQuery.data)) {
    return (
      <ClubRouteErrorState
        title="기능 설정"
        message={getQueryErrorMessage(clubError ?? featuresQuery.error, "기능 설정을 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void Promise.all([refetchClub(), featuresQuery.refetch()])}
      />
    );
  }

  if (isClubPending || featuresQuery.isPending || !club) {
    return <AdminMenuLoadingShell />;
  }

  return (
    <ClubAdminMenuClient
      clubId={clubId}
      clubName={club.name}
      initialFeatures={features}
    />
  );
}
