import { ClubScheduleVoteDetailClient } from "../../clients/ClubScheduleVoteDetailClient";

type ClubScheduleVoteDetailPageProps = {
  params: Promise<{
    clubId: string;
    voteId: string;
  }>;
};

export default async function ClubScheduleVoteDetailPage({
  params,
}: ClubScheduleVoteDetailPageProps) {
  const { clubId, voteId } = await params;
  return (
    <ClubScheduleVoteDetailClient
      clubId={clubId}
      voteId={voteId}
      presentation="page"
      basePath={`/clubs/${clubId}/schedule`}
    />
  );
}
