import { redirect } from "next/navigation";

type ClubPollPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubPollPage({ params }: ClubPollPageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/schedule`);
}
