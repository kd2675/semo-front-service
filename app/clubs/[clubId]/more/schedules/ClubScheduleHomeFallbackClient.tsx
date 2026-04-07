"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubScheduleHome } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
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

  const { data: payload, isError } = useQuery({
    queryKey: clubKeys.schedule.home(clubId),
    queryFn: () => unwrap(getClubScheduleHome(clubId)),
  });

  useEffect(() => {
    if (isError) {
      router.replace(mode === "admin" ? `/clubs/${clubId}/admin` : `/clubs/${clubId}`);
    }
  }, [isError, mode, clubId, router]);

  if (!payload) {
    return <ClubScheduleHomeLoadingShell mode={mode} />;
  }

  return <ClubScheduleHomeClient clubId={clubId} initialData={payload} mode={mode} />;
}
