import { ClubDecisionLogClient } from "./ClubDecisionLogClient";

export default async function ClubDecisionLogPage({ params }: { params: Promise<{ clubId: string }> }) {
  const { clubId } = await params;
  return <ClubDecisionLogClient clubId={clubId} />;
}
