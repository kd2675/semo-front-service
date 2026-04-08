"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { ClubAdminSettingsClient } from "./ClubAdminSettingsClient";

type ClubAdminSettingsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminSettingsFallbackClient({ clubId }: ClubAdminSettingsFallbackClientProps) {
  const router = useRouter();
  const { data: club, isPending, isError } = useQuery(myClubQueryOptions(clubId));

  useEffect(() => {
    if (!isPending && (isError || !club || !club.admin)) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [club, clubId, isError, isPending, router]);

  if (!club) {
    return <div className="min-h-screen bg-[#f8f6f6]" />;
  }

  return <ClubAdminSettingsClient clubId={clubId} initialClub={club} />;
}
