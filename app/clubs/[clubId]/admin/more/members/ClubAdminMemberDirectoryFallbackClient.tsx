"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { adminMemberDirectorySettingsQueryOptions } from "@/app/lib/react-query/members/queries";
import { AdminFeatureSettingsLoadingShell } from "../../AdminRouteLoadingShells";
import { ClubAdminMemberDirectoryClient } from "./ClubAdminMemberDirectoryClient";

type ClubAdminMemberDirectoryFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMemberDirectoryFallbackClient({
  clubId,
}: ClubAdminMemberDirectoryFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, directoryQuery] = useQueries({
    queries: [myClubQueryOptions(clubId), adminMemberDirectorySettingsQueryOptions(clubId)],
  });
  const club = clubQuery.data ?? null;
  const directory = directoryQuery.data ?? null;

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !directoryQuery.isPending &&
      (clubQuery.isError || directoryQuery.isError || !club || !directory || !club.admin)
    ) {
      router.replace(club?.admin === false ? `/clubs/${clubId}` : `/clubs/${clubId}/admin`);
    }
  }, [
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    directory,
    directoryQuery.isError,
    directoryQuery.isPending,
    router,
  ]);

  if (!club || !directory) {
    return <AdminFeatureSettingsLoadingShell />;
  }

  return <ClubAdminMemberDirectoryClient clubId={clubId} initialData={directory} />;
}
