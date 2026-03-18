import { ClubPollFallbackClient } from "./ClubPollFallbackClient";

type ClubPollPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubPollPage({ params }: ClubPollPageProps) {
  const { clubId } = await params;
  return <ClubPollFallbackClient clubId={clubId} />;
}
