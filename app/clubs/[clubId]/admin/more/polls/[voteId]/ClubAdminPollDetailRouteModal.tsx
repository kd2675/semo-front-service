"use client";

import { useRouter } from "next/navigation";
import { RouteModalPresence } from "@/app/components/RouteModalPresence";
import { ClubPollDetailModal } from "@/app/components/ClubDetailModals";

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
      <RouteModalPresence onExitComplete={handleDismiss}>
        {(requestClose) => (
          <ClubPollDetailModal
            clubId={clubId}
            voteId={voteId}
            mode="admin"
            onRequestClose={requestClose}
          />
        )}
      </RouteModalPresence>
    </div>
  );
}
