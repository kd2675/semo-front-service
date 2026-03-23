import { redirect } from "next/navigation";

type ClubAdminPollPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminPollPage({ params }: ClubAdminPollPageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}/admin/more/roles?feature=POLL`);
}
