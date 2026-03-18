"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubScheduleVoteEditorClient } from "@/app/clubs/[clubId]/schedule/ClubScheduleVoteEditorClient";

type ClubPollEditRouteModalProps = {
  clubId: string;
  voteId: string;
};

export function ClubPollEditRouteModal({
  clubId,
  voteId,
}: ClubPollEditRouteModalProps) {
  const router = useRouter();
  const basePath = `/clubs/${clubId}/more/polls`;

  const handleDismiss = () => {
    router.push(basePath);
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      <RouteModal onDismiss={handleDismiss} dismissOnBackdrop={false}>
        <ClubScheduleVoteEditorClient
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
