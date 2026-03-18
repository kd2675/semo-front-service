import { ClubNoticeHomeFallbackClient } from "./ClubNoticeHomeFallbackClient";

type ClubNoticeHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubNoticeHomePage({ params }: ClubNoticeHomePageProps) {
  const { clubId } = await params;
  return <ClubNoticeHomeFallbackClient clubId={clubId} />;
}
