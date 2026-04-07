"use client";

import { useRouter } from "next/navigation";
import { RouteModalPresence } from "@/app/components/RouteModalPresence";
import { ClubNoticeDetailModal } from "@/app/components/ClubDetailModals";

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
      <RouteModalPresence onExitComplete={handleDismiss}>
        {(requestClose) => (
          <ClubNoticeDetailModal
            clubId={clubId}
            noticeId={noticeId}
            mode={mode}
            onRequestClose={requestClose}
          />
        )}
      </RouteModalPresence>
    </div>
  );
}
