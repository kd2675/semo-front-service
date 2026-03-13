import { ClubAdminAttendanceFallbackClient } from "./ClubAdminAttendanceFallbackClient";

type ClubAdminAttendancePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminAttendancePage({
  params,
}: ClubAdminAttendancePageProps) {
  const { clubId } = await params;
  return <ClubAdminAttendanceFallbackClient clubId={clubId} />;
}
