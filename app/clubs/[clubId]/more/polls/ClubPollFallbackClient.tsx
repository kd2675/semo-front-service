"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubPollHome } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
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

  const { data: payload, isError } = useQuery({
    queryKey: clubKeys.poll.home(clubId),
    queryFn: () => unwrap(getClubPollHome(clubId)),
  });

  useEffect(() => {
    if (isError) {
      router.replace(mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`);
    }
  }, [isError, mode, clubId, router]);

  if (!payload) {
    return <ClubPollHomeLoadingShell mode={mode} />;
  }

  return <ClubPollHomeClient clubId={clubId} initialData={payload} mode={mode} />;
}
