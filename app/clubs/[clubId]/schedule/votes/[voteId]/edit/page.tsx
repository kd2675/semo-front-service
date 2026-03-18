import { redirect } from "next/navigation";

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
  redirect(`/clubs/${clubId}/more/polls/${voteId}/edit`);
}
