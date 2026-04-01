import { ClubAdminDuesFallbackClient } from "./ClubAdminDuesFallbackClient";

type ClubAdminDuesPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminDuesPage({ params }: ClubAdminDuesPageProps) {
  const { clubId } = await params;
  return <ClubAdminDuesFallbackClient clubId={clubId} />;
}
