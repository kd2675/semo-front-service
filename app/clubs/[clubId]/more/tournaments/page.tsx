import { ClubTournamentHomeFallbackClient } from "./ClubTournamentHomeFallbackClient";

type ClubTournamentHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubTournamentHomePage({
  params,
}: ClubTournamentHomePageProps) {
  const { clubId } = await params;
  return <ClubTournamentHomeFallbackClient clubId={clubId} />;
}
