import { ClubPollDetailRouteModal } from "./ClubPollDetailRouteModal";

type ClubPollDetailPageProps = {
  params: Promise<{
    clubId: string;
    voteId: string;
  }>;
};

export default async function ClubPollDetailPage({
  params,
}: ClubPollDetailPageProps) {
  const { clubId, voteId } = await params;
  return <ClubPollDetailRouteModal clubId={clubId} voteId={voteId} />;
}
