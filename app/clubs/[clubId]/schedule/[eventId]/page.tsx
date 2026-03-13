import { ClubScheduleDetailClient } from "../ClubScheduleDetailClient";

type ClubScheduleDetailPageProps = {
  params: Promise<{
    clubId: string;
    eventId: string;
  }>;
};

export default async function ClubScheduleDetailPage({ params }: ClubScheduleDetailPageProps) {
  const { clubId, eventId } = await params;
  return <ClubScheduleDetailClient clubId={clubId} eventId={eventId} />;
}
