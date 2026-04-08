import { queryOptions } from "@tanstack/react-query";
import {
  getClubAdminFinance,
  getClubAdminFinanceExpenses,
  getClubAdminFinanceObligationDetail,
  getClubAdminFinanceObligations,
  getClubAdminFinanceRequests,
  getClubFinance,
  getClubFinanceRequests,
} from "@/app/lib/clubs";
import { getApiDataOrFallback, requireApiData } from "@/app/lib/queryUtils";

export const financeQueryKeys = {
  financeHome: (clubId: string) => ["semo", "clubs", clubId, "finance"] as const,
  financeRequests: (clubId: string) => ["semo", "clubs", clubId, "finance-requests"] as const,
  adminFinanceHome: (clubId: string) => ["semo", "clubs", clubId, "admin-finance-home"] as const,
  adminFinanceRequests: (clubId: string) =>
    ["semo", "clubs", clubId, "admin-finance-requests"] as const,
  adminFinanceExpenses: (clubId: string) =>
    ["semo", "clubs", clubId, "admin-finance-expenses"] as const,
  adminFinanceObligations: (
    clubId: string,
    options: {
      query?: string;
      obligationFilter?: string;
      cursorObligationId?: number | null;
      size?: number;
    } = {},
  ) => ["semo", "clubs", clubId, "admin-finance-obligations", options] as const,
  adminFinanceObligationDetail: (clubId: string, obligationId: number) =>
    ["semo", "clubs", clubId, "admin-finance-obligation-detail", obligationId] as const,
};

export function financeHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: financeQueryKeys.financeHome(clubId),
    queryFn: async () =>
      requireApiData(await getClubFinance(clubId), "재정 정보를 불러오지 못했습니다."),
  });
}

export function financeRequestsQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: financeQueryKeys.financeRequests(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubFinanceRequests(clubId),
        "재정 요청 목록을 불러오지 못했습니다.",
      ),
  });
}

export function financeRequestsFallbackQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: financeQueryKeys.financeRequests(clubId),
    queryFn: async () =>
      getApiDataOrFallback(await getClubFinanceRequests(clubId), {
        clubId: Number(clubId),
        clubName: "",
        items: [],
      }),
  });
}

export function adminFinanceHomeQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: financeQueryKeys.adminFinanceHome(clubId),
    queryFn: async () =>
      requireApiData(await getClubAdminFinance(clubId), "운영 재정을 불러오지 못했습니다."),
  });
}

export function adminFinanceRequestsQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: financeQueryKeys.adminFinanceRequests(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminFinanceRequests(clubId),
        "재정 요청 목록을 다시 불러오지 못했습니다.",
      ),
  });
}

export function adminFinanceRequestsFallbackQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: financeQueryKeys.adminFinanceRequests(clubId),
    queryFn: async () =>
      getApiDataOrFallback(await getClubAdminFinanceRequests(clubId), {
        clubId: Number(clubId),
        clubName: "",
        items: [],
      }),
  });
}

export function adminFinanceExpensesQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: financeQueryKeys.adminFinanceExpenses(clubId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminFinanceExpenses(clubId),
        "지출 목록을 다시 불러오지 못했습니다.",
      ),
  });
}

export function adminFinanceExpensesFallbackQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: financeQueryKeys.adminFinanceExpenses(clubId),
    queryFn: async () =>
      getApiDataOrFallback(await getClubAdminFinanceExpenses(clubId), {
        clubId: Number(clubId),
        clubName: "",
        items: [],
      }),
  });
}

export function adminFinanceObligationsQueryOptions(
  clubId: string,
  options: {
    query?: string;
    obligationFilter?: string;
    cursorObligationId?: number | null;
    size?: number;
  } = {},
) {
  return queryOptions({
    queryKey: financeQueryKeys.adminFinanceObligations(clubId, options),
    queryFn: async () =>
      requireApiData(
        await getClubAdminFinanceObligations(clubId, options),
        options.cursorObligationId == null
          ? "재정 항목을 불러오지 못했습니다."
          : "재정 항목을 더 불러오지 못했습니다.",
      ),
  });
}

export function adminFinanceObligationDetailQueryOptions(clubId: string, obligationId: number) {
  return queryOptions({
    queryKey: financeQueryKeys.adminFinanceObligationDetail(clubId, obligationId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminFinanceObligationDetail(clubId, obligationId),
        "재정 상세를 불러오지 못했습니다.",
      ),
  });
}
