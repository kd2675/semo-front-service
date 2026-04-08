"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  scheduleHomeQueryOptions,
  scheduleQueryKeys,
} from "@/app/lib/react-query/schedule/queries";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: payload, isPending, isFetching, isError } = useQuery(
    scheduleHomeQueryOptions(clubId),
  );

  useEffect(() => {
    if (!isPending && isError) {
        router.replace(mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`);
    }
  }, [clubId, isError, isPending, mode, router]);

  const handleReload = () => {
    void queryClient.invalidateQueries({
      queryKey: scheduleQueryKeys.scheduleHome(clubId),
    });
  };

  if (isPending || isFetching || !payload) {
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
