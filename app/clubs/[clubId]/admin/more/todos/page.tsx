import { ClubAdminTodoFallbackClient } from "./ClubAdminTodoFallbackClient";

type ClubAdminTodoPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubAdminTodoPage({ params }: ClubAdminTodoPageProps) {
  const { clubId } = await params;
  return <ClubAdminTodoFallbackClient clubId={clubId} />;
}
