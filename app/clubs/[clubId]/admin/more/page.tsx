import { ClubMoreHubClient } from "@/app/components/ClubMoreHubClient";

type ClubAdminMorePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminMorePage({ params }: ClubAdminMorePageProps) {
  const { clubId } = await params;
  return <ClubMoreHubClient clubId={clubId} mode="admin" />;
}
