"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: club,
    isPending: isClubPending,
    isError: isClubError,
  } = useQuery(myClubQueryOptions(clubId));
  const { data: features = [] } = useQuery(clubFeaturesQueryOptions(clubId));

  useEffect(() => {
    if (!isClubPending && (isClubError || !club || !club.admin)) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [club, clubId, isClubError, isClubPending, router]);

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

  if (!club) {
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
