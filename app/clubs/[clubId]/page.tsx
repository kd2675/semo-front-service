import { ClubDashboardFallbackClient } from "./dashboard/ClubDashboardFallbackClient";

type ClubPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubDashboardPage({ params }: ClubPageProps) {
  const { clubId } = await params;
  return <ClubDashboardFallbackClient clubId={clubId} />;
}
