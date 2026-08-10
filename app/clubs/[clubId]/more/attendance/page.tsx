import { redirect } from "next/navigation";

type ClubAttendancePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAttendancePage({ params }: ClubAttendancePageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/schedule`);
}
