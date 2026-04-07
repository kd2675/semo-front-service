"use client";

import { useRouter } from "next/navigation";
import { RouteModalPresence } from "@/app/components/RouteModalPresence";
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
      <RouteModalPresence onExitComplete={handleDismiss}>
        {(requestClose) => (
          <ClubNoticeDetailModal
            clubId={clubId}
            noticeId={noticeId}
            onRequestClose={requestClose}
          />
        )}
      </RouteModalPresence>
    </div>
  );
}
