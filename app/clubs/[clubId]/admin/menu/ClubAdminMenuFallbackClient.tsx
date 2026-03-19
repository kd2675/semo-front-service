"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminMenuLoadingShell } from "../AdminRouteLoadingShells";
import { ClubAdminMenuClient } from "./ClubAdminMenuClient";
import {
  getClubFeatures,
  getMyClub,
  type ClubFeatureSummary,
  type MyClubSummary,
} from "@/app/lib/clubs";

type ClubAdminMenuFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMenuFallbackClient({ clubId }: ClubAdminMenuFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [features, setFeatures] = useState<ClubFeatureSummary[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      const [clubResult, featureResult] = await Promise.all([
        getMyClub(clubId),
        getClubFeatures(clubId),
      ]);
      if (cancelled || !clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }
      setClub(clubResult.data);
      setFeatures(featureResult.ok && featureResult.data ? featureResult.data : []);
    };

    const reloadFeatures = async () => {
      const featureResult = await getClubFeatures(clubId);
      if (cancelled || !featureResult.ok || !featureResult.data) {
        return;
      }
      setFeatures(featureResult.data);
    };

    void loadInitial();

    const onFeatureUpdate = () => {
      void reloadFeatures();
    };
    window.addEventListener("semo:club-features-updated", onFeatureUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener("semo:club-features-updated", onFeatureUpdate);
    };
  }, [clubId, router]);

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
