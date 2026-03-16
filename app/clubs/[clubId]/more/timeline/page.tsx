import { ClubTimelineFallbackClient } from "./ClubTimelineFallbackClient";

type ClubTimelinePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubTimelinePage({ params }: ClubTimelinePageProps) {
  const { clubId } = await params;
  return <ClubTimelineFallbackClient clubId={clubId} />;
}
