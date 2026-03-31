import { ClubTournamentHomeFallbackClient } from "../../../more/tournaments/ClubTournamentHomeFallbackClient";

type ClubAdminTournamentHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminTournamentHomePage({
  params,
}: ClubAdminTournamentHomePageProps) {
  const { clubId } = await params;
  return <ClubTournamentHomeFallbackClient clubId={clubId} mode="admin" />;
}
