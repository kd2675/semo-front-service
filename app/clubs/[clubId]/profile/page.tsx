import { ClubProfileFallbackClient } from "./ClubProfileFallbackClient";

type ClubProfilePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubProfilePage({ params }: ClubProfilePageProps) {
  const { clubId } = await params;
  return <ClubProfileFallbackClient clubId={clubId} />;
}
