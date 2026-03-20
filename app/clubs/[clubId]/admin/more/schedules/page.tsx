import { ClubAdminScheduleSettingsFallbackClient } from "./ClubAdminScheduleSettingsFallbackClient";

type ClubAdminScheduleHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminScheduleHomePage({
  params,
}: ClubAdminScheduleHomePageProps) {
  const { clubId } = await params;
  return <ClubAdminScheduleSettingsFallbackClient clubId={clubId} />;
}
