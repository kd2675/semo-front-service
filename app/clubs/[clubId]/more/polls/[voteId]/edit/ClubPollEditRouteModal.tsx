import { ClubScheduleVoteEditorClient } from "@/app/clubs/[clubId]/schedule/clients/ClubScheduleVoteEditorClient";

type ClubPollEditRouteModalProps = {
  clubId: string;
  voteId: string;
};

export function ClubPollEditRouteModal({
  clubId,
  voteId,
}: ClubPollEditRouteModalProps) {
  const basePath = `/clubs/${clubId}/more/polls`;

  return (
    <ClubScheduleVoteEditorClient
      clubId={clubId}
      voteId={voteId}
      presentation="page"
      basePath={basePath}
    />
  );
}
