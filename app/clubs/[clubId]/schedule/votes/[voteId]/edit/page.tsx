import { ClubScheduleVoteEditorClient } from "../../../ClubScheduleVoteEditorClient";

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
  return <ClubScheduleVoteEditorClient clubId={clubId} voteId={voteId} />;
}
