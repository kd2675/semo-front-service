"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  boardQueryKeys,
  noticeHomeQueryOptions,
} from "@/app/lib/react-query/board/queries";
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
  const queryClient = useQueryClient();
  const {
    data: payload,
    isPending,
    isFetching,
    isError,
  } = useQuery(noticeHomeQueryOptions(clubId));

  useEffect(() => {
    if (isError) {
      router.replace(mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`);
    }
  }, [clubId, isError, mode, router]);

  const handleReload = () => {
      void queryClient.invalidateQueries({
        queryKey: boardQueryKeys.noticeHome(clubId),
      });
  };

  if (isPending || isFetching || !payload) {
    return <ClubBoardFeedLoadingShell />;
  }

  return (
    <ClubNoticeHomeClient
      clubId={clubId}
      payload={payload}
      mode={mode}
      onReload={handleReload}
    />
  );
}
