import { ClubPollEditRouteModal } from "./ClubPollEditRouteModal";

type ClubPollEditPageProps = {
  params: Promise<{
    clubId: string;
    voteId: string;
  }>;
};

export default async function ClubPollEditPage({
  params,
}: ClubPollEditPageProps) {
  const { clubId, voteId } = await params;
  return <ClubPollEditRouteModal clubId={clubId} voteId={voteId} />;
}
