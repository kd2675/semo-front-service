"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubMemberDirectory,
  getMyClub,
  type ClubMemberDirectoryResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubTimelineLoadingShell } from "../../ClubRouteLoadingShells";
import { ClubMemberDirectoryClient } from "./ClubMemberDirectoryClient";

type ClubMemberDirectoryFallbackClientProps = {
  clubId: string;
};

export function ClubMemberDirectoryFallbackClient({
  clubId,
}: ClubMemberDirectoryFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [directory, setDirectory] = useState<ClubMemberDirectoryResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, directoryResult] = await Promise.all([
        getMyClub(clubId),
        getClubMemberDirectory(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !directoryResult.ok || !directoryResult.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      setClub(clubResult.data);
      setDirectory(directoryResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

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
