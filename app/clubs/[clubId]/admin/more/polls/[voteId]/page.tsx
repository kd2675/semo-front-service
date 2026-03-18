import { ClubAdminPollDetailRouteModal } from "./ClubAdminPollDetailRouteModal";

type ClubAdminPollDetailPageProps = {
  params: Promise<{
    clubId: string;
    voteId: string;
  }>;
};

export default async function ClubAdminPollDetailPage({
  params,
}: ClubAdminPollDetailPageProps) {
  const { clubId, voteId } = await params;
  return <ClubAdminPollDetailRouteModal clubId={clubId} voteId={voteId} />;
}
