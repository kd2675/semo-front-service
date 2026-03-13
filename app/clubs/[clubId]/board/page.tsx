import { ClubBoardFallbackClient } from "./ClubBoardFallbackClient";

type ClubBoardPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubBoardPage({ params }: ClubBoardPageProps) {
  const { clubId } = await params;
  return <ClubBoardFallbackClient clubId={clubId} />;
}
