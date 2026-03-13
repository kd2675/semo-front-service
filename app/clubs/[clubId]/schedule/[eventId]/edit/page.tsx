import { ClubScheduleEditorClient } from "../../ClubScheduleEditorClient";

type ClubScheduleEditPageProps = {
  params: Promise<{
    clubId: string;
    eventId: string;
  }>;
};

export default async function ClubScheduleEditPage({ params }: ClubScheduleEditPageProps) {
  const { clubId, eventId } = await params;
  return <ClubScheduleEditorClient clubId={clubId} eventId={eventId} />;
}
