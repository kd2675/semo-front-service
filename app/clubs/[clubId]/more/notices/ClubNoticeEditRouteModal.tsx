import { ClubNoticeEditorClient } from "@/app/clubs/[clubId]/board/clients/ClubNoticeEditorClient";

type ClubNoticeEditRouteModalProps = {
  clubId: string;
  noticeId: string;
  mode?: "user" | "admin";
};

export function ClubNoticeEditRouteModal({
  clubId,
  noticeId,
  mode = "user",
}: ClubNoticeEditRouteModalProps) {
  const basePath = mode === "admin" ? `/clubs/${clubId}/admin/more/notices` : `/clubs/${clubId}/more/notices`;

  return (
    <ClubNoticeEditorClient
      clubId={clubId}
      noticeId={noticeId}
      presentation="page"
      basePath={basePath}
    />
  );
}
