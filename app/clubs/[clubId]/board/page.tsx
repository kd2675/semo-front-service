import { notFound } from "next/navigation";
import { CLUB_DASHBOARDS, getClubDashboard, getClubNotices } from "@/app/lib/mock-clubs";
import { NoticeBoardClient } from "./NoticeBoardClient";

type ClubBoardPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export async function generateStaticParams() {
  return CLUB_DASHBOARDS.map((club) => ({ clubId: club.id }));
}

export default async function ClubBoardPage({ params }: ClubBoardPageProps) {
  const { clubId } = await params;
  const club = getClubDashboard(clubId);

  if (!club) {
    notFound();
  }

  return (
    <NoticeBoardClient
      clubId={club.id}
      clubName={club.name}
      notices={getClubNotices(club.id)}
      isAdmin={club.isAdmin}
    />
  );
}
