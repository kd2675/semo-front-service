import { ClubNoticeHomeFallbackClient } from "../../../more/notices/ClubNoticeHomeFallbackClient";

type ClubAdminNoticeHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminNoticeHomePage({ params }: ClubAdminNoticeHomePageProps) {
  const { clubId } = await params;
  return <ClubNoticeHomeFallbackClient clubId={clubId} mode="admin" />;
}
