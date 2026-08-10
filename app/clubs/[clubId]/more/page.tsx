import { ClubMoreHubClient } from "@/app/components/ClubMoreHubClient";

type ClubMorePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubMorePage({ params }: ClubMorePageProps) {
  const { clubId } = await params;
  return <ClubMoreHubClient clubId={clubId} mode="user" />;
}
