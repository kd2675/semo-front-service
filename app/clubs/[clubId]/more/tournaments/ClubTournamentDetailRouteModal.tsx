"use client";

import { useRouter } from "next/navigation";
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
      <ClubTournamentDetailModal
        clubId={clubId}
        tournamentRecordId={tournamentRecordId}
        mode={mode}
        onRequestClose={() => router.push(basePath)}
      />
    </div>
  );
}
