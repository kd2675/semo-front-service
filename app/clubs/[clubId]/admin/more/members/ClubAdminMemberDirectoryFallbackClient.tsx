"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminMemberDirectorySettings,
  getMyClub,
  type ClubAdminMemberDirectorySettingsResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminMemberDirectoryClient } from "./ClubAdminMemberDirectoryClient";

type ClubAdminMemberDirectoryFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMemberDirectoryFallbackClient({
  clubId,
}: ClubAdminMemberDirectoryFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [directory, setDirectory] = useState<ClubAdminMemberDirectorySettingsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, directoryResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminMemberDirectorySettings(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!directoryResult.ok || !directoryResult.data) {
        router.replace(`/clubs/${clubId}/admin`);
        return;
      }

      setClub(clubResult.data);
      setDirectory(directoryResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !directory) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminMemberDirectoryClient clubId={clubId} initialData={directory} />;
}
