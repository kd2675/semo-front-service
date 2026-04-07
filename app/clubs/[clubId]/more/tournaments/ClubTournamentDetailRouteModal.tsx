"use client";

import { useRouter } from "next/navigation";
import { RouteModalPresence } from "@/app/components/RouteModalPresence";
import { ClubTournamentDetailModal } from "@/app/components/ClubDetailModals";

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
  const router = useRouter();
  const basePath = mode === "admin"
    ? `/clubs/${clubId}/admin/more/tournaments`
    : `/clubs/${clubId}/more/tournaments`;

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      <RouteModalPresence onExitComplete={() => router.push(basePath)}>
        {(requestClose) => (
          <ClubTournamentDetailModal
            clubId={clubId}
            tournamentRecordId={tournamentRecordId}
            mode={mode}
            onRequestClose={requestClose}
          />
        )}
      </RouteModalPresence>
    </div>
  );
}
