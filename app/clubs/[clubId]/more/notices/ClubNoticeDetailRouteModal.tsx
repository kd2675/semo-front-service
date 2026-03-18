"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubNoticeDetailClient } from "@/app/clubs/[clubId]/board/[noticeId]/ClubNoticeDetailClient";

type ClubNoticeDetailRouteModalProps = {
  clubId: string;
  noticeId: string;
  mode?: "user" | "admin";
};

export function ClubNoticeDetailRouteModal({
  clubId,
  noticeId,
  mode = "user",
}: ClubNoticeDetailRouteModalProps) {
  const router = useRouter();
  const basePath = mode === "admin" ? `/clubs/${clubId}/admin/more/notices` : `/clubs/${clubId}/more/notices`;

  const handleDismiss = () => {
    router.push(basePath);
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      <RouteModal onDismiss={handleDismiss}>
        <ClubNoticeDetailClient
          clubId={clubId}
          noticeId={noticeId}
          presentation="modal"
          basePath={basePath}
          onRequestClose={handleDismiss}
        />
      </RouteModal>
    </div>
  );
}
