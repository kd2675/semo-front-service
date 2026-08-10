import { ClubDecisionAdminClient } from "./ClubDecisionAdminClient";

export default async function ClubDecisionAdminPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  return <ClubDecisionAdminClient clubId={clubId} />;
}
