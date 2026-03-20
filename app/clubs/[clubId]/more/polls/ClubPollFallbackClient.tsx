"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClubPollHome, type ClubPollHomeResponse } from "@/app/lib/clubs";
import { ClubPollHomeLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubPollHomeClient } from "./ClubPollHomeClient";

type ClubPollFallbackClientProps = {
  clubId: string;
  mode?: "user" | "admin";
};

export function ClubPollFallbackClient({
  clubId,
  mode = "user",
}: ClubPollFallbackClientProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<ClubPollHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const result = await getClubPollHome(clubId);
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
    return <ClubPollHomeLoadingShell mode={mode} />;
  }

  return (
    <ClubPollHomeClient
      clubId={clubId}
      payload={payload}
      mode={mode}
      onReload={handleReload}
    />
  );
}
