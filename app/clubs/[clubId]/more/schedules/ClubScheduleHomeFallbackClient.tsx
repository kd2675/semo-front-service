"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClubScheduleHome, type ClubScheduleHomeResponse } from "@/app/lib/clubs";
import { ClubScheduleHomeLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubScheduleHomeClient } from "./ClubScheduleHomeClient";

type ClubScheduleHomeFallbackClientProps = {
  clubId: string;
  mode?: "user" | "admin";
};

export function ClubScheduleHomeFallbackClient({
  clubId,
  mode = "user",
}: ClubScheduleHomeFallbackClientProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<ClubScheduleHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const result = await getClubScheduleHome(clubId);
      if (cancelled) {
        return;
      }

      setLoading(false);
      if (!result.ok || !result.data) {
        router.replace(mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`);
        return;
      }

      setPayload(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, mode, reloadKey, router]);

  const handleReload = () => {
    startTransition(() => {
      setReloadKey((current) => current + 1);
    });
  };

  if (loading || !payload) {
    return <ClubScheduleHomeLoadingShell mode={mode} />;
  }

  return (
    <ClubScheduleHomeClient
      clubId={clubId}
      payload={payload}
      mode={mode}
      onReload={handleReload}
    />
  );
}
