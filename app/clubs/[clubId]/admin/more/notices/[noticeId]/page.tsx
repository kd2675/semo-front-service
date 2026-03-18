import { ClubNoticeDetailRouteModal } from "@/app/clubs/[clubId]/more/notices/ClubNoticeDetailRouteModal";

type ClubAdminNoticeDetailPageProps = {
  params: Promise<{
    clubId: string;
    noticeId: string;
  }>;
};

export default async function ClubAdminNoticeDetailPage({ params }: ClubAdminNoticeDetailPageProps) {
  const { clubId, noticeId } = await params;
  return <ClubNoticeDetailRouteModal clubId={clubId} noticeId={noticeId} mode="admin" />;
}
