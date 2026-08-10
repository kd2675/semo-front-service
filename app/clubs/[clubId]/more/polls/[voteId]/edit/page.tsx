import { redirect } from "next/navigation";

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
  redirect(`/clubs/${clubId}/schedule/votes/${voteId}/edit`);
}
