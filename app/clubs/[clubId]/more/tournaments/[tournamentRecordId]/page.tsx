import { ClubTournamentDetailRouteModal } from "../ClubTournamentDetailRouteModal";

type ClubTournamentDetailPageProps = {
  params: Promise<{
    clubId: string;
    tournamentRecordId: string;
  }>;
};

export default async function ClubTournamentDetailPage({
  params,
}: ClubTournamentDetailPageProps) {
  const { clubId, tournamentRecordId } = await params;
  return (
    <ClubTournamentDetailRouteModal
      clubId={clubId}
      tournamentRecordId={tournamentRecordId}
    />
  );
}
