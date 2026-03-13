import { ClubAdminFallbackClient } from "./ClubAdminFallbackClient";

type ClubAdminPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminPage({ params }: ClubAdminPageProps) {
  const { clubId } = await params;
  return <ClubAdminFallbackClient clubId={clubId} />;
}
