import { redirect } from "next/navigation";

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
  redirect(`/clubs/${clubId}/schedule/votes/${voteId}`);
}
