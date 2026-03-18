"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubNoticeEditorClient } from "@/app/clubs/[clubId]/board/ClubNoticeEditorClient";

type ClubNoticeEditRouteModalProps = {
  clubId: string;
  noticeId: string;
  mode?: "user" | "admin";
};

export function ClubNoticeEditRouteModal({
  clubId,
  noticeId,
  mode = "user",
}: ClubNoticeEditRouteModalProps) {
  const router = useRouter();
  const basePath = mode === "admin" ? `/clubs/${clubId}/admin/more/notices` : `/clubs/${clubId}/more/notices`;

  const handleDismiss = () => {
    router.push(basePath);
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      <RouteModal onDismiss={handleDismiss} dismissOnBackdrop={false}>
        <ClubNoticeEditorClient
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
