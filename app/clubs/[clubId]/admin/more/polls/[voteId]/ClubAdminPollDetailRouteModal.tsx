import { ClubScheduleVoteDetailClient } from "@/app/clubs/[clubId]/schedule/clients/ClubScheduleVoteDetailClient";

type ClubAdminPollDetailRouteModalProps = {
  clubId: string;
  voteId: string;
};

export function ClubAdminPollDetailRouteModal({
  clubId,
  voteId,
}: ClubAdminPollDetailRouteModalProps) {
  const basePath = `/clubs/${clubId}/admin/more/polls`;

  return (
    <ClubScheduleVoteDetailClient
      clubId={clubId}
      voteId={voteId}
      presentation="page"
      basePath={basePath}
    />
  );
}
