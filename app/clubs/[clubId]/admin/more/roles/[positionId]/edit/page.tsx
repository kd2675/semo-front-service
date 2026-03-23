import { ClubAdminRoleEditFallbackClient } from "./ClubAdminRoleEditFallbackClient";

type ClubAdminRoleEditPageProps = {
  params: Promise<{
    clubId: string;
    positionId: string;
  }>;
};

export default async function ClubAdminRoleEditPage({ params }: ClubAdminRoleEditPageProps) {
  const { clubId, positionId } = await params;
  return <ClubAdminRoleEditFallbackClient clubId={clubId} positionId={positionId} />;
}
