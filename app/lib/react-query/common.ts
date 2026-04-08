import type { QueryClient } from "@tanstack/react-query";

export const semoQueryScopes = {
  club: (clubId: string) => ["semo", "clubs", clubId] as const,
};

export async function invalidateClubQueries(
  queryClient: QueryClient,
  clubId: string,
) {
  await queryClient.invalidateQueries({
    queryKey: semoQueryScopes.club(clubId),
  });
}
