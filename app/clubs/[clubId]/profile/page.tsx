import { ClubProfileClient } from "./ClubProfileClient";
import { ClubProfileFallbackClient } from "./ClubProfileFallbackClient";
import { CLUB_DASHBOARDS, getClubDashboard, getClubMemberProfile } from "@/app/lib/mock-clubs";

type ClubProfilePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export async function generateStaticParams() {
  return CLUB_DASHBOARDS.map((club) => ({ clubId: club.id }));
}

export default async function ClubProfilePage({ params }: ClubProfilePageProps) {
  const { clubId } = await params;
  const club = getClubDashboard(clubId);
  const profile = getClubMemberProfile(clubId);

  if (!club || !profile) {
    return <ClubProfileFallbackClient clubId={clubId} />;
  }

  return <ClubProfileClient club={club} profile={profile} />;
}
