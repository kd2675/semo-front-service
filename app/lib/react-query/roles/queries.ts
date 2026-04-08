import { queryOptions } from "@tanstack/react-query";
import { getClubAdminRoleDetail, getClubAdminRoleManagement } from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/query-utils";

export const roleQueryKeys = {
  adminRoleManagement: (clubId: string) =>
    ["semo", "clubs", clubId, "admin-role-management"] as const,
  adminRoleDetail: (clubId: string, positionId: string | number) =>
    ["semo", "clubs", clubId, "admin-role-detail", positionId] as const,
};

export function adminRoleManagementQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: roleQueryKeys.adminRoleManagement(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminRoleManagement(clubId),
        "직책 정보를 불러오지 못했습니다.",
      ),
  });
}

export function adminRoleDetailQueryOptions(clubId: string, positionId: string | number) {
  return queryOptions({
    queryKey: roleQueryKeys.adminRoleDetail(clubId, positionId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminRoleDetail(clubId, positionId),
        "직책 상세를 불러오지 못했습니다.",
      ),
  });
}
