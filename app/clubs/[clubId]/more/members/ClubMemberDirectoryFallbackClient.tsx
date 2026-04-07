"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getClubMemberDirectory, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubMemberDirectoryClient } from "./ClubMemberDirectoryClient";

type ClubMemberDirectoryFallbackClientProps = {
  clubId: string;
};

export function ClubMemberDirectoryFallbackClient({
  clubId,
}: ClubMemberDirectoryFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const { data: directory, isError: directoryError } = useQuery({
    queryKey: clubKeys.memberDirectory(clubId),
    queryFn: () => unwrap(getClubMemberDirectory(clubId)),
  });

  useEffect(() => {
    if (clubError || directoryError) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [clubError, directoryError, clubId, router]);

  if (!club || !directory) {
    return <ClubTimelineLoadingShell />;
  }

  return (
    <ClubMemberDirectoryClient
      clubId={clubId}
      initialData={directory}
      isAdmin={club.admin}
    />
  );
}
