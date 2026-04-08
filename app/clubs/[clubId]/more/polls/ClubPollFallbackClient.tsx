"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { boardQueryKeys, pollHomeQueryOptions } from "@/app/lib/react-query/board/queries";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: payload, isPending, isFetching, isError } = useQuery(
    pollHomeQueryOptions(clubId),
  );

  useEffect(() => {
    if (!isPending && isError) {
        router.replace(mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`);
    }
  }, [clubId, isError, isPending, mode, router]);

  const handleReload = () => {
    void queryClient.invalidateQueries({
      queryKey: boardQueryKeys.pollHome(clubId),
    });
  };

  if (isPending || isFetching || !payload) {
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
