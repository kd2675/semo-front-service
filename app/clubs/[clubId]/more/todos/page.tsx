import { ClubTodoFallbackClient } from "./ClubTodoFallbackClient";

type ClubTodoPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export default async function ClubTodoPage({ params }: ClubTodoPageProps) {
  const { clubId } = await params;
  return <ClubTodoFallbackClient clubId={clubId} />;
}
