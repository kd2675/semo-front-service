"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyClub, type MyClubSummary } from "@/app/lib/clubs";
import { ClubAdminStatsClient } from "./ClubAdminStatsClient";

type ClubAdminStatsFallbackClientProps = {
  clubId: string;
};

export function ClubAdminStatsFallbackClient({ clubId }: ClubAdminStatsFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getMyClub(clubId);
      if (cancelled || !result.ok || !result.data || !result.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }
      setClub(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  const metrics = useMemo(
    () => [
      { id: "engagement", label: "Engagement", value: "84%", detail: "Across posts and events", accent: "primary" as const, icon: "favorite" },
      { id: "attendance", label: "Attendance", value: "78%", detail: "Average weekly attendance", accent: "green" as const, icon: "event_available" },
      { id: "growth", label: "Growth", value: "+12%", detail: "Compared with last month", accent: "primary" as const, icon: "trending_up" },
      { id: "dues", label: "Dues Paid", value: "91%", detail: "Current payment completion", icon: "payments" },
    ],
    [],
  );

  const attendanceSeries = useMemo(
    () => [
      { id: "w1", label: "1주", percentage: 52 },
      { id: "w2", label: "2주", percentage: 67 },
      { id: "w3", label: "3주", percentage: 59 },
      { id: "w4", label: "4주", percentage: 82 },
      { id: "w5", label: "이번 주", percentage: 91 },
    ],
    [],
  );

  if (!club) {
    return null;
  }

  return (
    <ClubAdminStatsClient
      clubId={clubId}
      clubName={club.name}
      metrics={metrics}
      attendanceSeries={attendanceSeries}
    />
  );
}
