import { ClubNoticeDetailClient } from "./ClubNoticeDetailClient";

type ClubNoticeDetailPageProps = {
  params: Promise<{
    clubId: string;
    noticeId: string;
  }>;
};

export default async function ClubNoticeDetailPage({ params }: ClubNoticeDetailPageProps) {
  const { clubId, noticeId } = await params;
  return <ClubNoticeDetailClient clubId={clubId} noticeId={noticeId} />;
}
