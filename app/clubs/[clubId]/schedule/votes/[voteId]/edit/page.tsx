import { ClubScheduleVoteEditorClient } from "../../../clients/ClubScheduleVoteEditorClient";

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
  return (
    <ClubScheduleVoteEditorClient
      clubId={clubId}
      voteId={voteId}
      presentation="page"
      basePath={`/clubs/${clubId}/schedule`}
    />
  );
}
