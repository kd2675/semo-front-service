"use client";

import { useRouter } from "next/navigation";
import { ClubNoticeDetailModal } from "@/app/components/ClubDetailModals";

type ClubNoticeDetailRouteModalProps = {
  clubId: string;
  noticeId: string;
};

export function ClubNoticeDetailRouteModal({
  clubId,
  noticeId,
}: ClubNoticeDetailRouteModalProps) {
  const router = useRouter();

  const handleDismiss = () => {
    router.push(`/clubs/${clubId}/board`);
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      <ClubNoticeDetailModal
        clubId={clubId}
        noticeId={noticeId}
        onRequestClose={handleDismiss}
      />
    </div>
  );
}
