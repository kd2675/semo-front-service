import { ClubNoticeDetailRouteModal } from "../ClubNoticeDetailRouteModal";

type ClubNoticeDetailPageProps = {
  params: Promise<{
    clubId: string;
    noticeId: string;
  }>;
};

export default async function ClubNoticeDetailPage({ params }: ClubNoticeDetailPageProps) {
  const { clubId, noticeId } = await params;
  return <ClubNoticeDetailRouteModal clubId={clubId} noticeId={noticeId} />;
}
