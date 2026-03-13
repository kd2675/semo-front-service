import { ClubAttendanceFallbackClient } from "./ClubAttendanceFallbackClient";

type ClubAttendancePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAttendancePage({ params }: ClubAttendancePageProps) {
  const { clubId } = await params;
  return <ClubAttendanceFallbackClient clubId={clubId} />;
}
