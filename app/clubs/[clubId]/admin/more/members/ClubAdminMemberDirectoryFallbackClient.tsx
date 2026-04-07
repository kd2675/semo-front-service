"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubAdminMemberDirectorySettings, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminMemberDirectoryClient } from "./ClubAdminMemberDirectoryClient";

type ClubAdminMemberDirectoryFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMemberDirectoryFallbackClient({
  clubId,
}: ClubAdminMemberDirectoryFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: directory, isError: directoryError } = useQuery({
    queryKey: adminKeys.memberDirectory(clubId),
    queryFn: () => unwrap(getClubAdminMemberDirectorySettings(clubId)),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (clubError || (club && !isAdmin)) {
      router.replace(`/clubs/${clubId}`);
    } else if (directoryError) {
      router.replace(`/clubs/${clubId}/admin`);
    }
  }, [clubError, club, isAdmin, directoryError, clubId, router]);

  if (!club || !directory) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminMemberDirectoryClient clubId={clubId} initialData={directory} />;
}
