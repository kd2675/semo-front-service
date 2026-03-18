import { ClubNoticeEditRouteModal } from "../../ClubNoticeEditRouteModal";

type ClubNoticeEditPageProps = {
  params: Promise<{
    clubId: string;
    noticeId: string;
  }>;
};

export default async function ClubNoticeEditPage({ params }: ClubNoticeEditPageProps) {
  const { clubId, noticeId } = await params;
  return <ClubNoticeEditRouteModal clubId={clubId} noticeId={noticeId} />;
}
