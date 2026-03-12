import { notFound } from "next/navigation";
import { ClubDashboardClient } from "../ClubDashboardClient";
import { CLUB_DASHBOARDS, getClubDashboard } from "@/app/lib/mock-clubs";

type ClubAdminPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export async function generateStaticParams() {
  return CLUB_DASHBOARDS.filter((club) => club.isAdmin).map((club) => ({ clubId: club.id }));
}

export default async function ClubAdminPage({ params }: ClubAdminPageProps) {
  const { clubId } = await params;
  const club = getClubDashboard(clubId);

  if (!club || !club.isAdmin) {
    notFound();
  }

  return <ClubDashboardClient club={club} />;
}
