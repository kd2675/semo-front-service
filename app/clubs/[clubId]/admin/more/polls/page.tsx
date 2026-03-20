import { ClubAdminPollSettingsFallbackClient } from "./ClubAdminPollSettingsFallbackClient";

type ClubAdminPollPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminPollPage({ params }: ClubAdminPollPageProps) {
  const { clubId } = await params;
  return <ClubAdminPollSettingsFallbackClient clubId={clubId} />;
}
