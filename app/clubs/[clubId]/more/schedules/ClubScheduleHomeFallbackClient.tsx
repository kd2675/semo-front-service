"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import {
  scheduleHomeQueryOptions,
  scheduleQueryKeys,
} from "@/app/lib/react-query/schedule/queries";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
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
  const queryClient = useQueryClient();
  const { data: payload, isPending, isError, error } = useQuery(
    scheduleHomeQueryOptions(clubId),
  );

  const handleReload = () => {
    void queryClient.invalidateQueries({
      queryKey: scheduleQueryKeys.scheduleHome(clubId),
    });
  };

  if (isError && !payload) {
    return (
      <ClubRouteErrorState
        title={mode === "admin" ? "일정 관리" : "일정"}
        message={getQueryErrorMessage(error, "일정 목록을 불러오지 못했습니다.")}
        backHref={mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`}
        theme={mode}
        onRetry={handleReload}
      />
    );
  }

  if (isPending || !payload) {
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
