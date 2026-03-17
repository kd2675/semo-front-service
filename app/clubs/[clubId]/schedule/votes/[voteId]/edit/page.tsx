import { ClubScheduleVoteEditRouteModal } from "./ClubScheduleVoteEditRouteModal";

type ClubScheduleVoteEditPageProps = {
  params: Promise<{
    clubId: string;
    voteId: string;
  }>;
};

export default async function ClubScheduleVoteEditPage({
  params,
}: ClubScheduleVoteEditPageProps) {
  const { clubId, voteId } = await params;
  return <ClubScheduleVoteEditRouteModal clubId={clubId} voteId={voteId} />;
}
