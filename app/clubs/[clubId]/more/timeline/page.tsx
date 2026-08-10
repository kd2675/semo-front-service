import { redirect } from "next/navigation";

type ClubTimelinePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubTimelinePage({ params }: ClubTimelinePageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/profile/activity`);
}
