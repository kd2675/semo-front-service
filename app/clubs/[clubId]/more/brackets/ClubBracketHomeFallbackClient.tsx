"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminBracketHome,
  getClubBracketHome,
  type ClubAdminBracketHomeResponse,
  type ClubBracketHomeResponse,
} from "@/app/lib/clubs";
import { ClubBoardFeedLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubBracketHomeClient } from "./ClubBracketHomeClient";

type ClubBracketHomeFallbackClientProps = {
  clubId: string;
  mode?: "user" | "admin";
};

export function ClubBracketHomeFallbackClient({
  clubId,
  mode = "user",
}: ClubBracketHomeFallbackClientProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<ClubBracketHomeResponse | ClubAdminBracketHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const result = mode === "admin"
        ? await getClubAdminBracketHome(clubId)
        : await getClubBracketHome(clubId);
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
    <ClubBracketHomeClient
      clubId={clubId}
      payload={payload}
      mode={mode}
      onReload={handleReload}
    />
  );
}
