import { ClubMemberActivityFallbackClient } from "./ClubMemberActivityFallbackClient";

type ClubProfileActivityPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubProfileActivityPage({ params }: ClubProfileActivityPageProps) {
  const { clubId } = await params;
  return <ClubMemberActivityFallbackClient clubId={clubId} />;
}
