import { redirect } from "next/navigation";

type ClubAdminNoticeDetailPageProps = {
  params: Promise<{
    clubId: string;
    noticeId: string;
  }>;
};

export default async function ClubAdminNoticeDetailPage({ params }: ClubAdminNoticeDetailPageProps) {
  const { clubId, noticeId } = await params;
  redirect(`/clubs/${clubId}/board/${noticeId}`);
}
