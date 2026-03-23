import { ClubAdminRoleAssignmentsFallbackClient } from "./ClubAdminRoleAssignmentsFallbackClient";

type ClubAdminRoleAssignmentsPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminRoleAssignmentsPage({
  params,
}: ClubAdminRoleAssignmentsPageProps) {
  const { clubId } = await params;
  return <ClubAdminRoleAssignmentsFallbackClient clubId={clubId} />;
}
