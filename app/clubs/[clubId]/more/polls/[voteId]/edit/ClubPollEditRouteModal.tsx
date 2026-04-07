"use client";

import { useRouter } from "next/navigation";
import { RouteModalPresence } from "@/app/components/RouteModalPresence";
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
      <RouteModalPresence onExitComplete={handleDismiss}>
        {(requestClose) => (
          <RouteModal onDismiss={requestClose} dismissOnBackdrop={false}>
            <ClubScheduleVoteEditorClient
              clubId={clubId}
              voteId={voteId}
              presentation="modal"
              basePath={basePath}
              onRequestClose={requestClose}
            />
          </RouteModal>
        )}
      </RouteModalPresence>
    </div>
  );
}
