import { ClubAdminMenuFallbackClient } from "./ClubAdminMenuFallbackClient";

type ClubAdminMenuPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminMenuPage({ params }: ClubAdminMenuPageProps) {
  const { clubId } = await params;
  return <ClubAdminMenuFallbackClient clubId={clubId} />;
}
