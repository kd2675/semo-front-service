"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubAdminActivities, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";
import { AdminHomeLoadingShell } from "../AdminRouteLoadingShells";
import { ClubAdminLogsClient } from "./ClubAdminLogsClient";

type ClubAdminLogsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminLogsFallbackClient({ clubId }: ClubAdminLogsFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: initialData, isError: logsError } = useQuery({
    queryKey: adminKeys.activities(clubId),
    queryFn: () => unwrap(getClubAdminActivities(clubId, { size: 20 })),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (clubError || (club && !isAdmin)) {
      router.replace(`/clubs/${clubId}`);
    } else if (logsError) {
      router.replace(`/clubs/${clubId}/admin`);
    }
  }, [clubError, club, isAdmin, logsError, clubId, router]);

  if (!club || !initialData) {
    return <AdminHomeLoadingShell />;
  }

  return <ClubAdminLogsClient clubId={clubId} clubName={club.name} initialData={initialData} />;
}
