import { ClubPollFallbackClient } from "@/app/clubs/[clubId]/more/polls/ClubPollFallbackClient";

type ClubAdminPollPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminPollPage({ params }: ClubAdminPollPageProps) {
  const { clubId } = await params;
  return <ClubPollFallbackClient clubId={clubId} mode="admin" />;
}
