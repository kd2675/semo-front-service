"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubNoticeDetailClient } from "./ClubNoticeDetailClient";

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
      <RouteModal onDismiss={handleDismiss}>
        <ClubNoticeDetailClient
          clubId={clubId}
          noticeId={noticeId}
          presentation="modal"
          onRequestClose={handleDismiss}
        />
      </RouteModal>
    </div>
  );
}
