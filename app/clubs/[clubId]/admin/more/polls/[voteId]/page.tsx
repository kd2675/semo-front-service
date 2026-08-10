import { redirect } from "next/navigation";

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
  redirect(`/clubs/${clubId}/schedule/votes/${voteId}`);
}
