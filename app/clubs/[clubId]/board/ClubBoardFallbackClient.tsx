"use client";

import { useEffect, useState } from "react";
import { getClubBoard, type ClubBoardResponse } from "@/app/lib/clubs";
import { NoticeBoardClient } from "./NoticeBoardClient";

type ClubBoardFallbackClientProps = {
  clubId: string;
};

export function ClubBoardFallbackClient({ clubId }: ClubBoardFallbackClientProps) {
  const [payload, setPayload] = useState<ClubBoardResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getClubBoard(clubId);
      if (cancelled || !result.ok || !result.data) {
        return;
      }
      setPayload(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  return (
    <NoticeBoardClient
      clubId={clubId}
      clubName={payload?.clubName ?? "Notice Board"}
      notices={payload?.notices ?? []}
      isAdmin={payload?.admin ?? false}
    />
  );
}
