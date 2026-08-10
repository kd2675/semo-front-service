import { redirect } from "next/navigation";

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
  redirect(`/clubs/${clubId}/schedule/votes/${voteId}/edit`);
}
