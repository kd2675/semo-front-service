import { redirect } from "next/navigation";

type ClubAdminRoleEditPageProps = {
  params: Promise<{
    clubId: string;
    positionId: string;
  }>;
};

export default async function ClubAdminRoleEditPage({ params }: ClubAdminRoleEditPageProps) {
  const { clubId, positionId } = await params;
  redirect(`/clubs/${clubId}/admin/more/roles?editPositionId=${encodeURIComponent(positionId)}&tab=overview`);
}
