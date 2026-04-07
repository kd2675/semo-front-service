"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubNoticeHome } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
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

  const { data: payload, isError } = useQuery({
    queryKey: clubKeys.notice.home(clubId),
    queryFn: () => unwrap(getClubNoticeHome(clubId)),
  });

  useEffect(() => {
    if (isError) {
      router.replace(mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`);
    }
  }, [isError, mode, clubId, router]);

  if (!payload) {
    return <ClubBoardFeedLoadingShell />;
  }

  return <ClubNoticeHomeClient clubId={clubId} initialData={payload} mode={mode} />;
}
