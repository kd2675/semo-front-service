import { ClubBracketHomeFallbackClient } from "../../../more/brackets/ClubBracketHomeFallbackClient";

type ClubAdminBracketHomePageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminBracketHomePage({
  params,
}: ClubAdminBracketHomePageProps) {
  const { clubId } = await params;
  return <ClubBracketHomeFallbackClient clubId={clubId} mode="admin" />;
}
