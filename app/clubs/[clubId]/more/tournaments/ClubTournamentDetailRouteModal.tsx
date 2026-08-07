import { ClubTournamentDetailClient } from "./clients/ClubTournamentDetailClient";

type ClubTournamentDetailRouteModalProps = {
  clubId: string;
  tournamentRecordId: string;
  mode?: "user" | "admin";
};

export function ClubTournamentDetailRouteModal({
  clubId,
  tournamentRecordId,
  mode = "user",
}: ClubTournamentDetailRouteModalProps) {
  const basePath = mode === "admin"
    ? `/clubs/${clubId}/admin/more/tournaments`
    : `/clubs/${clubId}/more/tournaments`;

  return (
    <ClubTournamentDetailClient
      clubId={clubId}
      tournamentRecordId={tournamentRecordId}
      mode={mode}
      presentation="page"
      basePath={basePath}
    />
  );
}
