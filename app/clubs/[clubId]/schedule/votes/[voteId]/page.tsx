import { ClubScheduleVoteDetailRouteModal } from "./ClubScheduleVoteDetailRouteModal";

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
  return <ClubScheduleVoteDetailRouteModal clubId={clubId} voteId={voteId} />;
}
