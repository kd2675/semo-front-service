import { ClubScheduleDetailClient } from "../clients/ClubScheduleDetailClient";

type ClubScheduleDetailRouteModalProps = {
  clubId: string;
  eventId: string;
};

export function ClubScheduleDetailRouteModal({
  clubId,
  eventId,
}: ClubScheduleDetailRouteModalProps) {
  return <ClubScheduleDetailClient clubId={clubId} eventId={eventId} presentation="page" />;
}
