import { ClubAdminSettingsFallbackClient } from "./ClubAdminSettingsFallbackClient";

type ClubAdminSettingsPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminSettingsPage({ params }: ClubAdminSettingsPageProps) {
  const { clubId } = await params;
  return <ClubAdminSettingsFallbackClient clubId={clubId} />;
}
