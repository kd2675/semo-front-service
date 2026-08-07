import { ClubScheduleVoteEditorClient } from "@/app/clubs/[clubId]/schedule/clients/ClubScheduleVoteEditorClient";

type ClubAdminPollEditRouteModalProps = {
  clubId: string;
  voteId: string;
};

export function ClubAdminPollEditRouteModal({
  clubId,
  voteId,
}: ClubAdminPollEditRouteModalProps) {
  const basePath = `/clubs/${clubId}/admin/more/polls`;

  return (
    <ClubScheduleVoteEditorClient
      clubId={clubId}
      voteId={voteId}
      presentation="page"
      basePath={basePath}
    />
  );
}
