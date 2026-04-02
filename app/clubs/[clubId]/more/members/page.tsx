import { ClubMemberDirectoryFallbackClient } from "./ClubMemberDirectoryFallbackClient";

type ClubMemberDirectoryPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubMemberDirectoryPage({
  params,
}: ClubMemberDirectoryPageProps) {
  const { clubId } = await params;
  return <ClubMemberDirectoryFallbackClient clubId={clubId} />;
}
