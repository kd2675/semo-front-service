import { ClubScheduleDetailRouteModal } from "./ClubScheduleDetailRouteModal";

type ClubScheduleDetailPageProps = {
  params: Promise<{
    clubId: string;
    eventId: string;
  }>;
};

export default async function ClubScheduleDetailPage({ params }: ClubScheduleDetailPageProps) {
  const { clubId, eventId } = await params;
  return <ClubScheduleDetailRouteModal clubId={clubId} eventId={eventId} />;
}
