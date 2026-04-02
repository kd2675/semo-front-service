import { ClubAdminMemberDirectoryFallbackClient } from "./ClubAdminMemberDirectoryFallbackClient";

type ClubAdminMemberDirectoryPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminMemberDirectoryPage({
  params,
}: ClubAdminMemberDirectoryPageProps) {
  const { clubId } = await params;
  return <ClubAdminMemberDirectoryFallbackClient clubId={clubId} />;
}
