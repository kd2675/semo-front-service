import { redirect } from "next/navigation";

type ClubAdminAttendancePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminAttendancePage({
  params,
}: ClubAdminAttendancePageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/schedule`);
}
