"use client";

import { useQuery } from "@tanstack/react-query";
import { startTransition, useState } from "react";
import { clubScheduleQueryOptions } from "@/app/lib/react-query/schedule/queries";
import { ScheduleClient } from "./ScheduleClient";
import { ClubScheduleLoadingShell } from "../ClubRouteLoadingShells";

type ClubScheduleFallbackClientProps = {
  clubId: string;
};

export function ClubScheduleFallbackClient({ clubId }: ClubScheduleFallbackClientProps) {
  const today = new Date();
  const [activeYear, setActiveYear] = useState(today.getFullYear());
  const [activeMonth, setActiveMonth] = useState(today.getMonth() + 1);
  const {
    data: payload,
    isPending,
    isFetching,
  } = useQuery(clubScheduleQueryOptions(clubId, activeYear, activeMonth));

  const handleMonthChange = (year: number, month: number) => {
    startTransition(() => {
      setActiveYear(year);
      setActiveMonth(month);
    });
  };

  if (isPending && !payload) {
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
          items: [],
        }
      }
      activeYear={payload?.calendarYear ?? activeYear}
      activeMonth={payload?.calendarMonth ?? activeMonth}
      isMonthLoading={isFetching}
      onChangeMonth={handleMonthChange}
    />
  );
}
