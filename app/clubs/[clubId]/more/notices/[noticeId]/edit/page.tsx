import { redirect } from "next/navigation";

type ClubNoticeEditPageProps = {
  params: Promise<{
    clubId: string;
    noticeId: string;
  }>;
};

export default async function ClubNoticeEditPage({ params }: ClubNoticeEditPageProps) {
  const { clubId, noticeId } = await params;
  redirect(`/clubs/${clubId}/board/${noticeId}/edit`);
}
