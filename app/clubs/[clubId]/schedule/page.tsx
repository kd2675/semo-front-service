import { ClubScheduleFallbackClient } from "./ClubScheduleFallbackClient";

type ClubSchedulePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubSchedulePage({ params }: ClubSchedulePageProps) {
  const { clubId } = await params;
  return <ClubScheduleFallbackClient clubId={clubId} />;
}
