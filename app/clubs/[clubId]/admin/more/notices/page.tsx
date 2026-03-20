import { ClubAdminNoticeSettingsFallbackClient } from "./ClubAdminNoticeSettingsFallbackClient";

type ClubAdminNoticeHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminNoticeHomePage({ params }: ClubAdminNoticeHomePageProps) {
  const { clubId } = await params;
  return <ClubAdminNoticeSettingsFallbackClient clubId={clubId} />;
}
