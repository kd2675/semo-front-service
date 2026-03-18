"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubScheduleVoteEditorClient } from "@/app/clubs/[clubId]/schedule/ClubScheduleVoteEditorClient";

type ClubAdminPollEditRouteModalProps = {
  clubId: string;
  voteId: string;
};

export function ClubAdminPollEditRouteModal({
  clubId,
  voteId,
}: ClubAdminPollEditRouteModalProps) {
  const router = useRouter();
  const basePath = `/clubs/${clubId}/admin/more/polls`;

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
