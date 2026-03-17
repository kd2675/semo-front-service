"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminMembersLoadingShell } from "../AdminRouteLoadingShells";
import { getClubAdminMembers, type ClubAdminMembersResponse } from "@/app/lib/clubs";
import { ClubAdminMembersClient } from "./ClubAdminMembersClient";

type ClubAdminMembersFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMembersFallbackClient({
  clubId,
}: ClubAdminMembersFallbackClientProps) {
  const router = useRouter();
  const [payload, setPayload] = useState<ClubAdminMembersResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getClubAdminMembers(clubId);
      if (cancelled) {
        return;
      }
      if (!result.ok || !result.data || !result.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }
      setPayload(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!payload) {
    return <AdminMembersLoadingShell />;
  }

  return (
    <ClubAdminMembersClient
      clubId={clubId}
      clubName={payload.clubName}
      initialMembers={payload.members}
    />
  );
}
