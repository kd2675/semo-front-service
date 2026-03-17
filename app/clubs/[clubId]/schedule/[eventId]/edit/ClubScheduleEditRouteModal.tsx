"use client";

import { useRouter } from "next/navigation";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubScheduleEditorClient } from "../../ClubScheduleEditorClient";

type ClubScheduleEditRouteModalProps = {
  clubId: string;
  eventId: string;
};

export function ClubScheduleEditRouteModal({
  clubId,
  eventId,
}: ClubScheduleEditRouteModalProps) {
  const router = useRouter();

  const handleDismiss = () => {
    router.push(`/clubs/${clubId}/schedule`);
  };

  return (
    <div className="min-h-screen bg-[var(--background-light)]">
      <RouteModal onDismiss={handleDismiss} dismissOnBackdrop={false}>
        <ClubScheduleEditorClient
          clubId={clubId}
          eventId={eventId}
          presentation="modal"
          onRequestClose={handleDismiss}
        />
      </RouteModal>
    </div>
  );
}
