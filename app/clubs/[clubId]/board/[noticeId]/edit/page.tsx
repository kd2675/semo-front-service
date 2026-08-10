import { ClubNoticeEditorClient } from "../../clients/ClubNoticeEditorClient";

type ClubNoticeEditPageProps = {
  params: Promise<{
    clubId: string;
    noticeId: string;
  }>;
};

export default async function ClubNoticeEditPage({ params }: ClubNoticeEditPageProps) {
  const { clubId, noticeId } = await params;
  return (
    <ClubNoticeEditorClient
      clubId={clubId}
      noticeId={noticeId}
      presentation="page"
      basePath={`/clubs/${clubId}/board`}
    />
  );
}
