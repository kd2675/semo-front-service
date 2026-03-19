"use client";

import { startTransition, useEffect, useState } from "react";
import { getClubSchedule, type ClubScheduleResponse } from "@/app/lib/clubs";
import { ScheduleClient } from "./ScheduleClient";
import { ClubScheduleLoadingShell } from "../ClubRouteLoadingShells";

type ClubScheduleFallbackClientProps = {
  clubId: string;
};

export function ClubScheduleFallbackClient({ clubId }: ClubScheduleFallbackClientProps) {
  const today = new Date();
  const [activeYear, setActiveYear] = useState(today.getFullYear());
  const [activeMonth, setActiveMonth] = useState(today.getMonth() + 1);
  const [payload, setPayload] = useState<ClubScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonthLoading, setIsMonthLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsMonthLoading(true);
      const result = await getClubSchedule(clubId, { year: activeYear, month: activeMonth });
      if (cancelled) {
        return;
      }

      setIsLoading(false);
      setIsMonthLoading(false);
      if (!result.ok || !result.data) {
        return;
      }
      setPayload(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeMonth, activeYear, clubId, reloadKey]);

  const handleMonthChange = (year: number, month: number) => {
    startTransition(() => {
      setActiveYear(year);
      setActiveMonth(month);
    });
  };

  const handleReloadMonth = () => {
    startTransition(() => {
      setReloadKey((current) => current + 1);
    });
  };

  if (isLoading) {
    return <ClubScheduleLoadingShell />;
  }

  return (
    <ScheduleClient
      key={`${payload?.calendarYear ?? activeYear}-${payload?.calendarMonth ?? activeMonth}`}
      clubId={clubId}
      payload={
        payload ?? {
          clubId: Number(clubId),
          clubName: "일정 스튜디오",
          admin: false,
          calendarYear: activeYear,
          calendarMonth: activeMonth,
          overview: {
            upcomingEventCount: 0,
            recentEventCount: 0,
            voteCount: 0,
            boardPostedEventCount: 0,
            boardPostedVoteCount: 0,
            pendingAttendanceCount: 0,
            pendingVoteCount: 0,
          },
          monthEvents: [],
          votes: [],
          sharedNotices: [],
        }
      }
      activeYear={payload?.calendarYear ?? activeYear}
      activeMonth={payload?.calendarMonth ?? activeMonth}
      isMonthLoading={isMonthLoading}
      onChangeMonth={handleMonthChange}
      onReloadMonth={handleReloadMonth}
    />
  );
}
