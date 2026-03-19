"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClubNoticeHome, type ClubNoticeHomeResponse } from "@/app/lib/clubs";
import { ClubBoardFeedLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubNoticeHomeClient } from "./ClubNoticeHomeClient";

type ClubNoticeHomeFallbackClientProps = {
  clubId: string;
  mode?: "user" | "admin";
};

export function ClubNoticeHomeFallbackClient({
  clubId,
  mode = "user",
}: ClubNoticeHomeFallbackClientProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<ClubNoticeHomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [pinnedOnly, setPinnedOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const result = await getClubNoticeHome(clubId, { pinnedOnly });
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
  }, [clubId, mode, pinnedOnly, reloadKey, router]);

  const handleReload = () => {
    startTransition(() => {
      setReloadKey((current) => current + 1);
    });
  };

  if (loading || !payload) {
    return <ClubBoardFeedLoadingShell />;
  }

  return (
    <ClubNoticeHomeClient
      clubId={clubId}
      payload={payload}
      mode={mode}
      pinnedOnly={pinnedOnly}
      onPinnedOnlyChange={setPinnedOnly}
      onReload={handleReload}
    />
  );
}
