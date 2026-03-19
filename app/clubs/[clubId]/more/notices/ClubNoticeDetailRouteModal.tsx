"use client";

import { useRouter } from "next/navigation";
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
      <ClubNoticeDetailModal
        clubId={clubId}
        noticeId={noticeId}
        mode={mode}
        onRequestClose={handleDismiss}
      />
    </div>
  );
}
