import { ClubScheduleEditRouteModal } from "./ClubScheduleEditRouteModal";

type ClubScheduleEditPageProps = {
  params: Promise<{
    clubId: string;
    eventId: string;
  }>;
};

export default async function ClubScheduleEditPage({ params }: ClubScheduleEditPageProps) {
  const { clubId, eventId } = await params;
  return <ClubScheduleEditRouteModal clubId={clubId} eventId={eventId} />;
}
