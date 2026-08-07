"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import {
  boardQueryKeys,
  noticeHomeQueryOptions,
} from "@/app/lib/react-query/board/queries";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
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
  const queryClient = useQueryClient();
  const {
    data: payload,
    isPending,
    isError,
    error,
  } = useQuery(noticeHomeQueryOptions(clubId));

  const handleReload = () => {
      void queryClient.invalidateQueries({
        queryKey: boardQueryKeys.noticeHome(clubId),
      });
  };

  if (isError && !payload) {
    return (
      <ClubRouteErrorState
        title={mode === "admin" ? "공지 관리" : "공지"}
        message={getQueryErrorMessage(error, "공지 목록을 불러오지 못했습니다.")}
        backHref={mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`}
        theme={mode}
        onRetry={handleReload}
      />
    );
  }

  if (isPending || !payload) {
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
