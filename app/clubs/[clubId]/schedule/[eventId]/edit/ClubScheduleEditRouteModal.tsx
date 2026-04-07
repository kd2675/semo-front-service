"use client";

import { useRouter } from "next/navigation";
import { RouteModalPresence } from "@/app/components/RouteModalPresence";
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
      <RouteModalPresence onExitComplete={handleDismiss}>
        {(requestClose) => (
          <RouteModal onDismiss={requestClose} dismissOnBackdrop={false}>
            <ClubScheduleEditorClient
              clubId={clubId}
              eventId={eventId}
              presentation="modal"
              onRequestClose={requestClose}
              onDeleted={requestClose}
            />
          </RouteModal>
        )}
      </RouteModalPresence>
    </div>
  );
}
