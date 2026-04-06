"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyClub, type MyClubSummary } from "@/app/lib/clubs";
import { ClubAdminSettingsClient } from "./ClubAdminSettingsClient";

type ClubAdminSettingsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminSettingsFallbackClient({ clubId }: ClubAdminSettingsFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getMyClub(clubId);
      if (cancelled || !result.ok || !result.data || !result.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }
      setClub(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club) {
    return <div className="min-h-screen bg-[#f8f6f6]" />;
  }

  return <ClubAdminSettingsClient clubId={clubId} initialClub={club} />;
}
