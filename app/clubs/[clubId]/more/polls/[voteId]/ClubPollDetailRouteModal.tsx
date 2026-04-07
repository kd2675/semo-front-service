"use client";

import { useRouter } from "next/navigation";
import { RouteModalPresence } from "@/app/components/RouteModalPresence";
import { ClubPollDetailModal } from "@/app/components/ClubDetailModals";

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
      <RouteModalPresence onExitComplete={handleDismiss}>
        {(requestClose) => (
          <ClubPollDetailModal
            clubId={clubId}
            voteId={voteId}
            mode="user"
            onRequestClose={requestClose}
          />
        )}
      </RouteModalPresence>
    </div>
  );
}
