"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getClubTimeline,
  getMyClub,
  type ClubTimelineResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";
import { ClubTimelineClient } from "./ClubTimelineClient";

type ClubTimelineFallbackClientProps = {
  clubId: string;
};

export function ClubTimelineFallbackClient({
  clubId,
}: ClubTimelineFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [timeline, setTimeline] = useState<ClubTimelineResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, timelineResult] = await Promise.all([
        getMyClub(clubId),
        getClubTimeline(clubId),
      ]);

      if (cancelled) {
        return;
      }

      if (!clubResult.ok || !clubResult.data || !timelineResult.ok || !timelineResult.data) {
        router.replace(`/clubs/${clubId}`);
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
      <div className="min-h-screen bg-[var(--background-light)]">
        <div className="mx-auto max-w-md px-4 pb-28 pt-4">
          <div className="h-14 rounded-2xl bg-white" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={`timeline-shell-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="h-4 w-24 rounded-full bg-slate-200" />
                <div className="mt-3 h-5 w-2/3 rounded-full bg-slate-200" />
                <div className="mt-2 h-4 w-full rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClubTimelineClient
      clubId={clubId}
      initialData={timeline}
      isAdmin={club.admin}
    />
  );
}
