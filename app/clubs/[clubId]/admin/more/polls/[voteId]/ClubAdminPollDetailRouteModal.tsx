"use client";

import { useRouter } from "next/navigation";
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
      <ClubPollDetailModal
        clubId={clubId}
        voteId={voteId}
        mode="admin"
        onRequestClose={handleDismiss}
      />
    </div>
  );
}
