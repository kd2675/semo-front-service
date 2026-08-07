import { ClubNoticeDetailClient } from "../../board/[noticeId]/ClubNoticeDetailClient";

type ClubNoticeDetailRouteModalProps = {
  clubId: string;
  noticeId: string;
  mode?: "user" | "admin";
};

export function ClubNoticeDetailRouteModal({
  clubId,
  noticeId,
  mode = "user",
}: ClubNoticeDetailRouteModalProps) {
  const basePath = mode === "admin" ? `/clubs/${clubId}/admin/more/notices` : `/clubs/${clubId}/more/notices`;

  return (
    <ClubNoticeDetailClient
      clubId={clubId}
      noticeId={noticeId}
      presentation="page"
      basePath={basePath}
    />
  );
}
