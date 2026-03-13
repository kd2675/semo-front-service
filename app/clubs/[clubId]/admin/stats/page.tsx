import { ClubAdminStatsFallbackClient } from "./ClubAdminStatsFallbackClient";

type ClubAdminStatsPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminStatsPage({ params }: ClubAdminStatsPageProps) {
  const { clubId } = await params;
  return <ClubAdminStatsFallbackClient clubId={clubId} />;
}
