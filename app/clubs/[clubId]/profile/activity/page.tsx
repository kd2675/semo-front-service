import { ClubTimelineFallbackClient } from "../../more/timeline/ClubTimelineFallbackClient";

type ClubProfileActivityPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubProfileActivityPage({ params }: ClubProfileActivityPageProps) {
  const { clubId } = await params;
  return <ClubTimelineFallbackClient clubId={clubId} />;
}
