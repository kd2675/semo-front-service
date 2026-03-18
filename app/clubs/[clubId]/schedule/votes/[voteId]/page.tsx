import { redirect } from "next/navigation";

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
  redirect(`/clubs/${clubId}/more/polls/${voteId}`);
}
