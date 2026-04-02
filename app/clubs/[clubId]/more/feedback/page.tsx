import { ClubFeedbackFallbackClient } from "./ClubFeedbackFallbackClient";

type ClubFeedbackPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubFeedbackPage({ params }: ClubFeedbackPageProps) {
  const { clubId } = await params;
  return <ClubFeedbackFallbackClient clubId={clubId} />;
}
