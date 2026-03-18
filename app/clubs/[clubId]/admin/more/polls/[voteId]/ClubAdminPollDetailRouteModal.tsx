"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubScheduleVoteDetailClient } from "@/app/clubs/[clubId]/schedule/ClubScheduleVoteDetailClient";

type ClubAdminPollDetailRouteModalProps = {
  clubId: string;
  voteId: string;
};

export function ClubAdminPollDetailRouteModal({
  clubId,
  voteId,
}: ClubAdminPollDetailRouteModalProps) {
  const router = useRouter();
  const basePath = `/clubs/${clubId}/admin/more/polls`;

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
