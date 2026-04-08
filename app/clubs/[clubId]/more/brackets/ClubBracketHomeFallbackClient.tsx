"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  adminBracketHomeQueryOptions,
  bracketHomeQueryOptions,
  bracketQueryKeys,
} from "@/app/lib/react-query/brackets/queries";
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
  const queryClient = useQueryClient();
  const isAdminMode = mode === "admin";
  const queryKey =
    isAdminMode
      ? bracketQueryKeys.adminBracketHome(clubId)
      : bracketQueryKeys.bracketHome(clubId);
  const adminQuery = useQuery({
    ...adminBracketHomeQueryOptions(clubId),
    enabled: isAdminMode,
  });
  const userQuery = useQuery({
    ...bracketHomeQueryOptions(clubId),
    enabled: !isAdminMode,
  });
  const payload = isAdminMode ? adminQuery.data : userQuery.data;
  const isPending = isAdminMode ? adminQuery.isPending : userQuery.isPending;
  const isFetching = isAdminMode ? adminQuery.isFetching : userQuery.isFetching;
  const isError = isAdminMode ? adminQuery.isError : userQuery.isError;

  useEffect(() => {
    if (!isPending && isError) {
      router.replace(isAdminMode ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`);
    }
  }, [clubId, isAdminMode, isError, isPending, router]);

  const handleReload = () => {
    void queryClient.invalidateQueries({ queryKey });
  };

  if (isPending || isFetching || !payload) {
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
