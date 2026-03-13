import { ClubAdminMembersFallbackClient } from "./ClubAdminMembersFallbackClient";

type ClubAdminMembersPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminMembersPage({ params }: ClubAdminMembersPageProps) {
  const { clubId } = await params;
  return <ClubAdminMembersFallbackClient clubId={clubId} />;
}
