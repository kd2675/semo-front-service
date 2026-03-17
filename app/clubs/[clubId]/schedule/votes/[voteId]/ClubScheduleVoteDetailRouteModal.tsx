"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubScheduleVoteDetailClient } from "../../ClubScheduleVoteDetailClient";

type ClubScheduleVoteDetailRouteModalProps = {
  clubId: string;
  voteId: string;
};

export function ClubScheduleVoteDetailRouteModal({
  clubId,
  voteId,
}: ClubScheduleVoteDetailRouteModalProps) {
  const router = useRouter();

  const handleDismiss = () => {
    router.push(`/clubs/${clubId}/schedule`);
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      <RouteModal onDismiss={handleDismiss}>
        <ClubScheduleVoteDetailClient
          clubId={clubId}
          voteId={voteId}
          presentation="modal"
          onRequestClose={handleDismiss}
        />
      </RouteModal>
    </div>
  );
}
