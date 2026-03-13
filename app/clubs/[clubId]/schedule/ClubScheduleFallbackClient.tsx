"use client";

import { useEffect, useMemo, useState } from "react";
import { getClubSchedule, type ClubScheduleResponse } from "@/app/lib/clubs";
import { ScheduleClient } from "./ScheduleClient";
import type { ClubScheduleMonth } from "@/app/lib/mock-clubs";

type ClubScheduleFallbackClientProps = {
  clubId: string;
};

export function ClubScheduleFallbackClient({ clubId }: ClubScheduleFallbackClientProps) {
  const [payload, setPayload] = useState<ClubScheduleResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getClubSchedule(clubId);
      if (cancelled || !result.ok || !result.data) {
        return;
      }
      setPayload(result.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  const months = useMemo<ClubScheduleMonth[]>(
    () =>
      (payload?.months ?? []).map((month) => ({
        id: month.id,
        label: month.label,
        shortLabel: month.shortLabel,
        year: month.year,
        month: month.month,
        leadingBlankDays: month.leadingBlankDays,
        daysInMonth: month.daysInMonth,
        defaultSelectedDay: month.defaultSelectedDay,
        eventsByDay: month.days.reduce<ClubScheduleMonth["eventsByDay"]>((acc, day) => {
          acc[day.day] = day.events.map((event) => ({
            ...event,
            durationLabel: event.durationLabel ?? undefined,
          }));
          return acc;
        }, {}),
      })),
    [payload],
  );

  return (
    <ScheduleClient
      clubId={clubId}
      clubName={payload?.clubName ?? "Club Schedule"}
      months={
        months.length > 0
          ? months
          : [
              {
                id: "empty",
                label: "This Month",
                shortLabel: "Today",
                year: 2026,
                month: 3,
                leadingBlankDays: 0,
                daysInMonth: 31,
                defaultSelectedDay: 1,
                eventsByDay: { 1: [] },
              },
            ]
      }
      isAdmin={payload?.admin ?? false}
    />
  );
}
