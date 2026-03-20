"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminPollSettings,
  getMyClub,
  type ClubAdminPollSettingsResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminPollSettingsClient } from "./ClubAdminPollSettingsClient";

type ClubAdminPollSettingsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminPollSettingsFallbackClient({
  clubId,
}: ClubAdminPollSettingsFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [settings, setSettings] = useState<ClubAdminPollSettingsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, settingsResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminPollSettings(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!settingsResult.ok || !settingsResult.data) {
        router.replace(`/clubs/${clubId}/admin`);
        return;
      }

      setClub(clubResult.data);
      setSettings(settingsResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !settings) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminPollSettingsClient clubId={clubId} initialData={settings} />;
}
