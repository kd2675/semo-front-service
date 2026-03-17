"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubScheduleDetailClient } from "../ClubScheduleDetailClient";

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
      <RouteModal onDismiss={handleDismiss}>
        <ClubScheduleDetailClient
          clubId={clubId}
          eventId={eventId}
          presentation="modal"
          onRequestClose={handleDismiss}
        />
      </RouteModal>
    </div>
  );
}
