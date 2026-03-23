import { ClubAdminLogsFallbackClient } from "./ClubAdminLogsFallbackClient";

type ClubAdminLogsPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminLogsPage({ params }: ClubAdminLogsPageProps) {
  const { clubId } = await params;
  return <ClubAdminLogsFallbackClient clubId={clubId} />;
}
