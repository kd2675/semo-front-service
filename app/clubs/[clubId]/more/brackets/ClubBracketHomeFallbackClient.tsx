"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import {
  adminBracketHomeQueryOptions,
  bracketHomeQueryOptions,
  bracketQueryKeys,
} from "@/app/lib/react-query/brackets/queries";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { ClubDataLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubBracketHomeClient } from "./ClubBracketHomeClient";

type ClubBracketHomeFallbackClientProps = {
  clubId: string;
  mode?: "user" | "admin";
};

export function ClubBracketHomeFallbackClient({
  clubId,
  mode = "user",
}: ClubBracketHomeFallbackClientProps) {
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
  const isError = isAdminMode ? adminQuery.isError : userQuery.isError;
  const error = isAdminMode ? adminQuery.error : userQuery.error;

  const handleReload = () => {
    void queryClient.invalidateQueries({ queryKey });
  };

  if (isError && !payload) {
    return (
      <ClubRouteErrorState
        title={isAdminMode ? "대진표 관리" : "대진표"}
        message={getQueryErrorMessage(error, "대진표 목록을 불러오지 못했습니다.")}
        backHref={isAdminMode ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`}
        theme={mode}
        onRetry={handleReload}
      />
    );
  }

  if (isPending || !payload) {
    return <ClubDataLoadingShell mode={mode} />;
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
