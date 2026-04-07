"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";
import { ClubAdminSettingsClient } from "./ClubAdminSettingsClient";

type ClubAdminSettingsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminSettingsFallbackClient({ clubId }: ClubAdminSettingsFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  useEffect(() => {
    if (isError || (club && !club.admin)) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [isError, club, clubId, router]);

  if (!club) {
    return <div className="min-h-screen bg-[#f8f6f6]" />;
  }

  return <ClubAdminSettingsClient clubId={clubId} initialClub={club} />;
}
