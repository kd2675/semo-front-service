import { ClubBracketHomeFallbackClient } from "./ClubBracketHomeFallbackClient";

type ClubBracketHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubBracketHomePage({
  params,
}: ClubBracketHomePageProps) {
  const { clubId } = await params;
  return <ClubBracketHomeFallbackClient clubId={clubId} />;
}
