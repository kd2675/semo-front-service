import { redirect } from "next/navigation";

type ClubAdminRoleAssignmentsPageProps = {
  params: Promise<{
    clubId: string;
  }>;
  searchParams: Promise<{
    positionId?: string;
  }>;
};

export default async function ClubAdminRoleAssignmentsPage({
  params,
  searchParams,
}: ClubAdminRoleAssignmentsPageProps) {
  const { clubId } = await params;
  const { positionId } = await searchParams;
  const queryString = positionId
    ? `?editPositionId=${encodeURIComponent(positionId)}&tab=members`
    : "";
  redirect(`/clubs/${clubId}/admin/more/roles${queryString}`);
}
