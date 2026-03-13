import { ClubDashboardClient } from "./ClubDashboardClient";
import { ClubDashboardFallbackClient } from "./ClubDashboardFallbackClient";
import { CLUB_DASHBOARDS, getClubDashboard } from "@/app/lib/mock-clubs";

type ClubPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export async function generateStaticParams() {
  return CLUB_DASHBOARDS.map((club) => ({ clubId: club.id }));
}

export default async function ClubDashboardPage({ params }: ClubPageProps) {
  const { clubId } = await params;
  const club = getClubDashboard(clubId);

  if (club) {
    return <ClubDashboardClient club={club} />;
  }

  return <ClubDashboardFallbackClient clubId={clubId} />;
}
