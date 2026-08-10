import { redirect } from "next/navigation";

type ClubScheduleHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubScheduleHomePage({ params }: ClubScheduleHomePageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/schedule`);
}
