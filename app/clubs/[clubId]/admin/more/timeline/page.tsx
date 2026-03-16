import { ClubAdminTimelineFallbackClient } from "./ClubAdminTimelineFallbackClient";

type ClubAdminTimelinePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminTimelinePage({
  params,
}: ClubAdminTimelinePageProps) {
  const { clubId } = await params;
  return <ClubAdminTimelineFallbackClient clubId={clubId} />;
}
