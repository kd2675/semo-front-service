import { ClubNoticeEditRouteModal } from "@/app/clubs/[clubId]/more/notices/ClubNoticeEditRouteModal";

type ClubAdminNoticeEditPageProps = {
  params: Promise<{
    clubId: string;
    noticeId: string;
  }>;
};

export default async function ClubAdminNoticeEditPage({ params }: ClubAdminNoticeEditPageProps) {
  const { clubId, noticeId } = await params;
  return <ClubNoticeEditRouteModal clubId={clubId} noticeId={noticeId} mode="admin" />;
}
