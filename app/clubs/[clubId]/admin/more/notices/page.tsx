import { redirect } from "next/navigation";

type ClubAdminNoticeHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminNoticeHomePage({ params }: ClubAdminNoticeHomePageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/admin/more/roles?feature=NOTICE`);
}
