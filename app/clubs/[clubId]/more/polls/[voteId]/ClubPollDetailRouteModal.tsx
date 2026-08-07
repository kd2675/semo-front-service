import { ClubScheduleVoteDetailClient } from "../../../schedule/clients/ClubScheduleVoteDetailClient";

type ClubPollDetailRouteModalProps = {
  clubId: string;
  voteId: string;
};

export function ClubPollDetailRouteModal({
  clubId,
  voteId,
}: ClubPollDetailRouteModalProps) {
  const basePath = `/clubs/${clubId}/more/polls`;

  return (
    <ClubScheduleVoteDetailClient
      clubId={clubId}
      voteId={voteId}
      presentation="page"
      basePath={basePath}
    />
  );
}
