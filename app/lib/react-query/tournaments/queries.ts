import { queryOptions } from "@tanstack/react-query";
import {
  getClubAdminTournamentHome,
  getClubTournamentDetail,
  getClubTournamentHome,
} from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/query-utils";

export const tournamentQueryKeys = {
  tournamentHome: (clubId: string) => ["semo", "clubs", clubId, "tournament-home"] as const,
  adminTournamentHome: (clubId: string) =>
    ["semo", "clubs", clubId, "admin-tournament-home"] as const,
  tournamentDetail: (clubId: string, tournamentRecordId: string | number) =>
    ["semo", "clubs", clubId, "tournament-detail", tournamentRecordId] as const,
};

export function tournamentHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: tournamentQueryKeys.tournamentHome(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubTournamentHome(clubId),
        "토너먼트 정보를 불러오지 못했습니다.",
      ),
  });
}

export function adminTournamentHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: tournamentQueryKeys.adminTournamentHome(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminTournamentHome(clubId),
        "토너먼트 정보를 불러오지 못했습니다.",
      ),
  });
}

export function tournamentDetailQueryOptions(clubId: string, tournamentRecordId: string | number) {
  return queryOptions({
    queryKey: tournamentQueryKeys.tournamentDetail(clubId, tournamentRecordId),
    queryFn: async () =>
      requireApiData(
        await getClubTournamentDetail(clubId, tournamentRecordId),
        "토너먼트 상세를 불러오지 못했습니다.",
      ),
  });
}
