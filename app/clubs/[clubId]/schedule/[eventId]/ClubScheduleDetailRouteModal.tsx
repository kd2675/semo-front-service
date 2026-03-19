"use client";

import { useRouter } from "next/navigation";
import { ClubScheduleEventDetailModal } from "@/app/components/ClubDetailModals";

type ClubScheduleDetailRouteModalProps = {
  clubId: string;
  eventId: string;
};

export function ClubScheduleDetailRouteModal({
  clubId,
  eventId,
}: ClubScheduleDetailRouteModalProps) {
  const router = useRouter();

  const handleDismiss = () => {
    router.push(`/clubs/${clubId}/schedule`);
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      <ClubScheduleEventDetailModal
        clubId={clubId}
        eventId={eventId}
        onRequestClose={handleDismiss}
      />
    </div>
  );
}
