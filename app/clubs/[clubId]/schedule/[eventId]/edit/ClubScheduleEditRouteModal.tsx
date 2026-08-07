import { ClubScheduleEditorClient } from "../../clients/ClubScheduleEditorClient";

type ClubScheduleEditRouteModalProps = {
  clubId: string;
  eventId: string;
};

export function ClubScheduleEditRouteModal({
  clubId,
  eventId,
}: ClubScheduleEditRouteModalProps) {
  return <ClubScheduleEditorClient clubId={clubId} eventId={eventId} presentation="page" />;
}
