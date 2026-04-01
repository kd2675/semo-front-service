import { ClubDuesFallbackClient } from "./ClubDuesFallbackClient";

type ClubDuesPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubDuesPage({ params }: ClubDuesPageProps) {
  const { clubId } = await params;
  return <ClubDuesFallbackClient clubId={clubId} />;
}
