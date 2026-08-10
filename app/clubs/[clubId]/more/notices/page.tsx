import { redirect } from "next/navigation";

type ClubNoticeHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubNoticeHomePage({ params }: ClubNoticeHomePageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/board`);
}
