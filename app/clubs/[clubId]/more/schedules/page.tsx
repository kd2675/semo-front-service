import { ClubScheduleHomeFallbackClient } from "./ClubScheduleHomeFallbackClient";

type ClubScheduleHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubScheduleHomePage({ params }: ClubScheduleHomePageProps) {
  const { clubId } = await params;
  return <ClubScheduleHomeFallbackClient clubId={clubId} />;
}
