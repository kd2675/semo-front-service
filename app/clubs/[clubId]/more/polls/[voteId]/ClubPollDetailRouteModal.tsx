"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubScheduleVoteDetailClient } from "@/app/clubs/[clubId]/schedule/ClubScheduleVoteDetailClient";

type ClubPollDetailRouteModalProps = {
  clubId: string;
  voteId: string;
};

export function ClubPollDetailRouteModal({
  clubId,
  voteId,
}: ClubPollDetailRouteModalProps) {
  const router = useRouter();
  const basePath = `/clubs/${clubId}/more/polls`;

  const handleDismiss = () => {
    router.push(basePath);
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      <RouteModal onDismiss={handleDismiss}>
        <ClubScheduleVoteDetailClient
          clubId={clubId}
          voteId={voteId}
          presentation="modal"
          basePath={basePath}
          onRequestClose={handleDismiss}
        />
      </RouteModal>
    </div>
  );
}
