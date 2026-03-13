import {
  CLUB_DASHBOARDS,
  getClubDashboard,
  getClubScheduleMonths,
} from "@/app/lib/mock-clubs";
import { ClubScheduleFallbackClient } from "./ClubScheduleFallbackClient";
import { ScheduleClient } from "./ScheduleClient";

type ClubSchedulePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export async function generateStaticParams() {
  return CLUB_DASHBOARDS.map((club) => ({ clubId: club.id }));
}

export default async function ClubSchedulePage({ params }: ClubSchedulePageProps) {
  const { clubId } = await params;
  const club = getClubDashboard(clubId);

  if (!club) {
    return <ClubScheduleFallbackClient clubId={clubId} />;
  }

  return (
    <ScheduleClient
      clubId={club.id}
      clubName={club.name}
      months={getClubScheduleMonths(club.id)}
      isAdmin={club.isAdmin}
    />
  );
}
