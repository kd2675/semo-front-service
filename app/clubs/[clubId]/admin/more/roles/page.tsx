import { ClubAdminRolesFallbackClient } from "./ClubAdminRolesFallbackClient";

type ClubAdminRolesPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminRolesPage({ params }: ClubAdminRolesPageProps) {
  const { clubId } = await params;
  return <ClubAdminRolesFallbackClient clubId={clubId} />;
}
