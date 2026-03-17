"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubScheduleVoteEditorClient } from "../../../ClubScheduleVoteEditorClient";

type ClubScheduleVoteEditRouteModalProps = {
  clubId: string;
  voteId: string;
};

export function ClubScheduleVoteEditRouteModal({
  clubId,
  voteId,
}: ClubScheduleVoteEditRouteModalProps) {
  const router = useRouter();

  const handleDismiss = () => {
    router.push(`/clubs/${clubId}/schedule`);
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      <RouteModal onDismiss={handleDismiss} dismissOnBackdrop={false}>
        <ClubScheduleVoteEditorClient
          clubId={clubId}
          voteId={voteId}
          presentation="modal"
          onRequestClose={handleDismiss}
        />
      </RouteModal>
    </div>
  );
}
