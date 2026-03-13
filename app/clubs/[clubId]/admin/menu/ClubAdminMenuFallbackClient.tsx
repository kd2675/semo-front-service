"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClubAdminMenuClient } from "./ClubAdminMenuClient";
import { getMyClub, type MyClubSummary } from "@/app/lib/clubs";

type ClubAdminMenuFallbackClientProps = {
  clubId: string;
};

export function ClubAdminMenuFallbackClient({ clubId }: ClubAdminMenuFallbackClientProps) {
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

  const activeWidgets = useMemo(
    () => [
      {
        id: "calendar",
        title: "Calendar",
        description: "Upcoming events and schedules",
        icon: "calendar_today",
      },
      {
        id: "chat",
        title: "Club Chat",
        description: "Latest community messages",
        icon: "forum",
      },
      {
        id: "dues",
        title: "Membership Dues",
        description: "Payment status tracking",
        icon: "payments",
      },
    ],
    [],
  );

  const availableWidgets = useMemo(
    () => [
      {
        id: "match-records",
        title: "Match Records",
        description: "History & statistics",
        icon: "sports_score",
      },
      {
        id: "leaderboard",
        title: "Leaderboard",
        description: "Top performers",
        icon: "leaderboard",
      },
      {
        id: "course-map",
        title: "Course Map",
        description: "GPS route preview",
        icon: "map",
        imageUrl:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuAUOtY4iZzFLi3xPh1fe7q8KzlDNWunHisdtiSqe-K4J4Htt1UeIrUoPBA1TRLW99CMj8IyvHdq29VBeAiG7QqH1zUIFK4jY1CQxZE9DRFugURDI8YzJXgQ7Ci0ID0ER-qiVYIOWhWaJkc9prnmLIgK1yVbpaUM2xG05p6IH4YEC16fSNJsPJZyv5Qby2Wcr_-BA47oQZJ4zFYmohrSGjreeiSQlwIBRkF0EYtWtv8MeFGxZFpnBTneAa-WH4KWZNo55hA5Sd4H-HQu",
      },
      {
        id: "daily-wod",
        title: "Daily WOD",
        description: "Workout of the day",
        icon: "fitness_center",
      },
    ],
    [],
  );

  if (!club) {
    return null;
  }

  return (
    <ClubAdminMenuClient
      clubId={clubId}
      clubName={club.name}
      activeWidgets={activeWidgets}
      availableWidgets={availableWidgets}
    />
  );
}
