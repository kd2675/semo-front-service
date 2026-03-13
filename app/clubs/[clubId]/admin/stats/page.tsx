import { notFound } from "next/navigation";
import { CLUB_DASHBOARDS, getClubDashboard } from "@/app/lib/mock-clubs";
import { ClubAdminStatsClient } from "./ClubAdminStatsClient";
import { ClubAdminStatsFallbackClient } from "./ClubAdminStatsFallbackClient";

type ClubAdminStatsPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export async function generateStaticParams() {
  return CLUB_DASHBOARDS.filter((club) => club.isAdmin).map((club) => ({ clubId: club.id }));
}

export default async function ClubAdminStatsPage({ params }: ClubAdminStatsPageProps) {
  const { clubId } = await params;
  const club = getClubDashboard(clubId);

  if (!club) {
    return <ClubAdminStatsFallbackClient clubId={clubId} />;
  }

  if (!club.isAdmin) {
    notFound();
  }

  return (
    <ClubAdminStatsClient
      clubId={club.id}
      clubName={club.name}
      metrics={[
        {
          id: "engagement",
          label: "Engagement",
          value: "84%",
          detail: "Across posts and events",
          accent: "primary",
          icon: "favorite",
        },
        {
          id: "attendance",
          label: "Attendance",
          value: "78%",
          detail: "Average weekly attendance",
          accent: "green",
          icon: "event_available",
        },
        {
          id: "growth",
          label: "Growth",
          value: "+12%",
          detail: "Compared with last month",
          accent: "primary",
          icon: "trending_up",
        },
        {
          id: "dues",
          label: "Dues Paid",
          value: "91%",
          detail: "Current payment completion",
          icon: "payments",
        },
      ]}
      attendanceSeries={[
        { id: "w1", label: "1주", percentage: 52 },
        { id: "w2", label: "2주", percentage: 67 },
        { id: "w3", label: "3주", percentage: 59 },
        { id: "w4", label: "4주", percentage: 82 },
        { id: "w5", label: "이번 주", percentage: 91 },
      ]}
    />
  );
}
