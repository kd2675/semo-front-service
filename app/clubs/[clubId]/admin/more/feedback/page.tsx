import { ClubAdminFeedbackFallbackClient } from "./ClubAdminFeedbackFallbackClient";

type ClubAdminFeedbackPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminFeedbackPage({
  params,
}: ClubAdminFeedbackPageProps) {
  const { clubId } = await params;
  return <ClubAdminFeedbackFallbackClient clubId={clubId} />;
}
