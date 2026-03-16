"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubAdminTimeline,
  getMyClub,
  type ClubAdminTimelineResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubAdminTimelineClient } from "./ClubAdminTimelineClient";

type ClubAdminTimelineFallbackClientProps = {
  clubId: string;
};

export function ClubAdminTimelineFallbackClient({
  clubId,
}: ClubAdminTimelineFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [timeline, setTimeline] = useState<ClubAdminTimelineResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, timelineResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminTimeline(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!timelineResult.ok || !timelineResult.data) {
        router.replace(`/clubs/${clubId}/admin`);
        return;
      }

      setClub(clubResult.data);
      setTimeline(timelineResult.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  if (!club || !timeline) {
    return (
      <div className="min-h-screen bg-[#f8f6f6] px-4 pt-4">
        <div className="mx-auto max-w-md space-y-4">
          <div className="h-14 rounded-2xl bg-white" />
          <div className="rounded-2xl bg-white p-5">
            <div className="h-5 w-32 rounded-full bg-slate-200" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={`timeline-admin-shell-${index}`} className="h-16 rounded-2xl bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <ClubAdminTimelineClient clubId={clubId} initialData={timeline} />;
}
