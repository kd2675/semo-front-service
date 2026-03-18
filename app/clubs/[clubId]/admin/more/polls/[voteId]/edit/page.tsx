import { ClubAdminPollEditRouteModal } from "./ClubAdminPollEditRouteModal";

type ClubAdminPollEditPageProps = {
  params: Promise<{
    clubId: string;
    voteId: string;
  }>;
};

export default async function ClubAdminPollEditPage({
  params,
}: ClubAdminPollEditPageProps) {
  const { clubId, voteId } = await params;
  return <ClubAdminPollEditRouteModal clubId={clubId} voteId={voteId} />;
}
