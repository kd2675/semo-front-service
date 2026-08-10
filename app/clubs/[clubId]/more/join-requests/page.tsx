import { redirect } from "next/navigation";

type ClubJoinRequestPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubJoinRequestPage({ params }: ClubJoinRequestPageProps) {
  const { clubId } = await params;
  redirect(`/clubs/${clubId}`);
}
