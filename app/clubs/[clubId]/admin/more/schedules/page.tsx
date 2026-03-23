import { ClubScheduleHomeFallbackClient } from "../../../more/schedules/ClubScheduleHomeFallbackClient";

type ClubAdminScheduleHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminScheduleHomePage({
  params,
}: ClubAdminScheduleHomePageProps) {
  const { clubId } = await params;
  return <ClubScheduleHomeFallbackClient clubId={clubId} mode="admin" />;
}
