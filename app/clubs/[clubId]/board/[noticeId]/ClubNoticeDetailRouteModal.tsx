import { ClubNoticeDetailClient } from "./ClubNoticeDetailClient";

type ClubNoticeDetailRouteModalProps = {
  clubId: string;
  noticeId: string;
};

export function ClubNoticeDetailRouteModal({
  clubId,
  noticeId,
}: ClubNoticeDetailRouteModalProps) {
  return (
    <ClubNoticeDetailClient
      clubId={clubId}
      noticeId={noticeId}
      presentation="page"
      basePath={`/clubs/${clubId}/board`}
    />
  );
}
