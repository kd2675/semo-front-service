import { ClubJoinRequestFallbackClient } from "./ClubJoinRequestFallbackClient";

type ClubJoinRequestPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubJoinRequestPage({ params }: ClubJoinRequestPageProps) {
  const { clubId } = await params;
  return <ClubJoinRequestFallbackClient clubId={clubId} />;
}
