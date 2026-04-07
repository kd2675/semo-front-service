"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AdminMenuLoadingShell } from "../AdminRouteLoadingShells";
import { ClubAdminMenuClient } from "./ClubAdminMenuClient";
import { getClubFeatures, getMyClub } from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys } from "@/app/lib/queryKeys";

type ClubAdminMenuFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMenuFallbackClient({ clubId }: ClubAdminMenuFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: features = [], isError: featuresError } = useQuery({
    queryKey: clubKeys.features(clubId),
    queryFn: () => unwrap(getClubFeatures(clubId)),
    enabled: isAdmin,
    retry: 1,
  });

  useEffect(() => {
    if (clubError || (club && !isAdmin)) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [clubError, club, isAdmin, clubId, router]);

  if (!club) {
    return <AdminMenuLoadingShell />;
  }

  return (
    <>
      {featuresError ? (
        <div className="mx-auto max-w-md px-4 pt-2">
          <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
            일부 데이터를 불러오지 못했습니다. 새로고침하면 다시 시도합니다.
          </div>
        </div>
      ) : null}
      <ClubAdminMenuClient
        clubId={clubId}
        clubName={club.name}
        initialFeatures={features}
      />
    </>
  );
}
