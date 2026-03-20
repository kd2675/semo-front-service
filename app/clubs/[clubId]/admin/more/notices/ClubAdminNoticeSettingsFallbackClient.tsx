"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminNoticeSettings,
  getMyClub,
  type ClubAdminNoticeSettingsResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminNoticeSettingsClient } from "./ClubAdminNoticeSettingsClient";

type ClubAdminNoticeSettingsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminNoticeSettingsFallbackClient({
  clubId,
}: ClubAdminNoticeSettingsFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [settings, setSettings] = useState<ClubAdminNoticeSettingsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, settingsResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminNoticeSettings(clubId),
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

  return <ClubAdminNoticeSettingsClient clubId={clubId} initialData={settings} />;
}
