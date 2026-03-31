"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminTournamentHome,
  getClubTournamentHome,
  type ClubAdminTournamentHomeResponse,
  type ClubTournamentHomeResponse,
} from "@/app/lib/clubs";
import { ClubBoardFeedLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubTournamentHomeClient } from "./ClubTournamentHomeClient";

type ClubTournamentHomeFallbackClientProps = {
  clubId: string;
  mode?: "user" | "admin";
};

export function ClubTournamentHomeFallbackClient({
  clubId,
  mode = "user",
}: ClubTournamentHomeFallbackClientProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<ClubTournamentHomeResponse | ClubAdminTournamentHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const result = mode === "admin"
        ? await getClubAdminTournamentHome(clubId)
        : await getClubTournamentHome(clubId);
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
    return <ClubBoardFeedLoadingShell />;
  }

  return (
    <ClubTournamentHomeClient
      clubId={clubId}
      payload={payload}
      mode={mode}
      onReload={handleReload}
    />
  );
}
