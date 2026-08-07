"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { boardQueryKeys, pollHomeQueryOptions } from "@/app/lib/react-query/board/queries";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
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
  const queryClient = useQueryClient();
  const { data: payload, isPending, isError, error } = useQuery(
    pollHomeQueryOptions(clubId),
  );

  const handleReload = () => {
    void queryClient.invalidateQueries({
      queryKey: boardQueryKeys.pollHome(clubId),
    });
  };

  if (isError && !payload) {
    return (
      <ClubRouteErrorState
        title={mode === "admin" ? "투표 관리" : "투표"}
        message={getQueryErrorMessage(error, "투표 목록을 불러오지 못했습니다.")}
        backHref={mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`}
        theme={mode}
        onRetry={handleReload}
      />
    );
  }

  if (isPending || !payload) {
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
