"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyClub, type MyClubSummary } from "@/app/lib/clubs";
import { AdminStatsLoadingShell } from "../AdminRouteLoadingShells";
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
      { id: "engagement", label: "참여도", value: "84%", detail: "게시글/일정 기준", accent: "primary" as const, icon: "favorite" },
      { id: "attendance", label: "출석률", value: "78%", detail: "주간 평균 출석", accent: "green" as const, icon: "event_available" },
      { id: "growth", label: "성장률", value: "+12%", detail: "전월 대비", accent: "primary" as const, icon: "trending_up" },
      { id: "dues", label: "회비 납부", value: "91%", detail: "현재 납부 완료율", icon: "payments" },
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
    return <AdminStatsLoadingShell />;
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
