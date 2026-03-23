import { ClubAdminRoleCreateFallbackClient } from "./ClubAdminRoleCreateFallbackClient";

type ClubAdminRoleCreatePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminRoleCreatePage({ params }: ClubAdminRoleCreatePageProps) {
  const { clubId } = await params;
  return <ClubAdminRoleCreateFallbackClient clubId={clubId} />;
}
