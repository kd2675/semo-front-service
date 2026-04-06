import { ClubAdminFinanceFallbackClient } from "./ClubAdminFinanceFallbackClient";

type ClubAdminFinancePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminFinancePage({ params }: ClubAdminFinancePageProps) {
  const { clubId } = await params;
  return <ClubAdminFinanceFallbackClient clubId={clubId} />;
}
