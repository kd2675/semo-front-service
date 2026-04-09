import { ClubAdminJoinRequestFallbackClient } from "./ClubAdminJoinRequestFallbackClient";

type ClubAdminJoinRequestPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminJoinRequestPage({
  params,
}: ClubAdminJoinRequestPageProps) {
  const { clubId } = await params;
  return <ClubAdminJoinRequestFallbackClient clubId={clubId} />;
}
