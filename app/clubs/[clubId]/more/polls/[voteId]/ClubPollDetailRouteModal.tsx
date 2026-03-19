"use client";

import { useRouter } from "next/navigation";
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
      <ClubPollDetailModal
        clubId={clubId}
        voteId={voteId}
        mode="user"
        onRequestClose={handleDismiss}
      />
    </div>
  );
}
