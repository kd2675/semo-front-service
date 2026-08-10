import { redirect } from "next/navigation";

type ClubAdminTimelinePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminTimelinePage({
  params,
}: ClubAdminTimelinePageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/admin/logs`);
}
