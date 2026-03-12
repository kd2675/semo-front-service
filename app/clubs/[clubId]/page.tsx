import { notFound } from "next/navigation";
import { ClubDashboardClient } from "./ClubDashboardClient";
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

  if (!club) {
    notFound();
  }

  return <ClubDashboardClient club={club} />;
}
