import { notFound } from "next/navigation";
import { ClubAdminMenuClient } from "./ClubAdminMenuClient";
import { ClubAdminMenuFallbackClient } from "./ClubAdminMenuFallbackClient";
import { CLUB_DASHBOARDS, getClubDashboard } from "@/app/lib/mock-clubs";

type ClubAdminMenuPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export async function generateStaticParams() {
  return CLUB_DASHBOARDS.filter((club) => club.isAdmin).map((club) => ({ clubId: club.id }));
}

export default async function ClubAdminMenuPage({ params }: ClubAdminMenuPageProps) {
  const { clubId } = await params;
  const club = getClubDashboard(clubId);

  if (!club) {
    return <ClubAdminMenuFallbackClient clubId={clubId} />;
  }

  if (!club.isAdmin) {
    notFound();
  }

  return (
    <ClubAdminMenuClient
      clubId={club.id}
      clubName={club.name}
      activeWidgets={[
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
      ]}
      availableWidgets={[
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
      ]}
    />
  );
}
