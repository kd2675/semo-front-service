import { redirect } from "next/navigation";

type ClubAdminScheduleHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminScheduleHomePage({
  params,
}: ClubAdminScheduleHomePageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/admin/more/roles?feature=SCHEDULE_MANAGE`);
}
