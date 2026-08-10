import { redirect } from "next/navigation";

type ClubAdminNoticeEditPageProps = {
  params: Promise<{
    clubId: string;
    noticeId: string;
  }>;
};

export default async function ClubAdminNoticeEditPage({ params }: ClubAdminNoticeEditPageProps) {
  const { clubId, noticeId } = await params;
  redirect(`/clubs/${clubId}/board/${noticeId}/edit`);
}
