import type { ClubAdminFinanceObligation } from "@/app/lib/clubs";

export type ObligationFilter = "ALL" | "OPEN" | "SETTLED";
export type TargetScope = "ALL_ACTIVE_MEMBERS" | "SELECTED_MEMBERS";
export type AdminFinanceTabKey = "DASHBOARD" | "BILLING" | "EXPENSES" | "SETTLEMENTS" | "OPERATIONS";

export const ADMIN_FINANCE_TABS: Array<{ key: AdminFinanceTabKey; label: string }> = [
  { key: "DASHBOARD", label: "재정 대시보드" },
  { key: "BILLING", label: "회비 관리" },
  { key: "EXPENSES", label: "지출 관리" },
  { key: "SETTLEMENTS", label: "정산 관리" },
  { key: "OPERATIONS", label: "예산·마감" },
];

export function resolveInitialFinanceTab(value: string | null): AdminFinanceTabKey {
  const normalized = value?.trim().toUpperCase();
  return ADMIN_FINANCE_TABS.some((tab) => tab.key === normalized)
    ? normalized as AdminFinanceTabKey
    : "DASHBOARD";
}

export function combineDateTimeValue(dateValue: string, timeValue: string) {
  if (!dateValue) {
    return null;
  }
  return `${dateValue}T${timeValue || "23:59"}:00`;
}

export function mergeObligationSummary(
  current: ClubAdminFinanceObligation[],
  nextObligation: ClubAdminFinanceObligation,
) {
  return current.map((obligation) =>
    obligation.obligationId === nextObligation.obligationId ? nextObligation : obligation,
  );
}
