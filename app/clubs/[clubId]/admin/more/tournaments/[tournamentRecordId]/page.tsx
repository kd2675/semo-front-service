import { ClubTournamentDetailRouteModal } from "@/app/clubs/[clubId]/more/tournaments/ClubTournamentDetailRouteModal";

type ClubAdminTournamentDetailPageProps = {
  params: Promise<{
    clubId: string;
    tournamentRecordId: string;
  }>;
};

export default async function ClubAdminTournamentDetailPage({
  params,
}: ClubAdminTournamentDetailPageProps) {
  const { clubId, tournamentRecordId } = await params;
  return (
    <ClubTournamentDetailRouteModal
      clubId={clubId}
      tournamentRecordId={tournamentRecordId}
      mode="admin"
    />
  );
}
