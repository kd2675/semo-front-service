import { ClubFinanceFallbackClient } from "./ClubFinanceFallbackClient";

type ClubFinancePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubFinancePage({ params }: ClubFinancePageProps) {
  const { clubId } = await params;
  return <ClubFinanceFallbackClient clubId={clubId} />;
}
