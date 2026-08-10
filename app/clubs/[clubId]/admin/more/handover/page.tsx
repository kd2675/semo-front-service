import { ClubAdminHandoverClient } from "./ClubAdminHandoverClient";

type ClubAdminHandoverPageProps = {
  params: Promise<{ clubId: string }>;
};

export default async function ClubAdminHandoverPage({ params }: ClubAdminHandoverPageProps) {
  const { clubId } = await params;
  return <ClubAdminHandoverClient clubId={clubId} />;
}
