import { ClubGrowthCoreDetailClient } from "./ClubGrowthCoreDetailClient";

type ClubGrowthPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubGrowthPage({ params }: ClubGrowthPageProps) {
  const { clubId } = await params;
  return <ClubGrowthCoreDetailClient clubId={clubId} />;
}
