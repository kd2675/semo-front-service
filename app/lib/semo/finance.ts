import { deleteJson, getJson, patchJson, postJson, putJson } from "@/app/lib/api";

type ClubId = string | number;

export type ClubFinancePayment = {
  paymentId: number;
  clubProfileId: number;
  memberDisplayName: string;
  memberRoleCode: string | null;
  financeAccountId: number | null;
  financeAccountName: string | null;
  paymentMethodCode: string | null;
  paymentMethodLabel: string | null;
  amount: number;
  amountLabel: string;
  currencyCode: string;
  paymentStatusCode: "PENDING" | "OVERDUE" | "PAID" | "WAIVED" | string;
  paymentStatusLabel: string;
  overdue: boolean;
  paidAt: string | null;
  paidAtLabel: string | null;
  note: string | null;
};

export type ClubFinanceMemberOption = {
  clubProfileId: number;
  memberDisplayName: string;
  memberRoleCode: string | null;
};

export type ClubAdminFinanceObligation = {
  obligationId: number;
  obligationTypeCode: string;
  obligationTypeLabel: string;
  title: string;
  targetScopeCode: "ALL_ACTIVE_MEMBERS" | "SELECTED_MEMBERS" | string;
  targetScopeLabel: string;
  amount: number;
  amountLabel: string;
  currencyCode: string;
  dueAt: string | null;
  dueAtLabel: string | null;
  issuedAt: string | null;
  issuedAtLabel: string | null;
  issuedByDisplayName: string;
  note: string | null;
  financePeriodId: number | null;
  financePeriodTitle: string | null;
  financeAccountId: number | null;
  financeAccountName: string | null;
  linkedScheduleEventId: number | null;
  linkedScheduleEventTitle: string | null;
  recurrenceFrequency: "NONE" | "MONTHLY" | "YEARLY" | string;
  recurrenceInterval: number;
  recurrenceEndDate: string | null;
  recurrenceLabel: string;
  canDelete: boolean;
  totalPaymentCount: number;
  pendingPaymentCount: number;
  paidPaymentCount: number;
  waivedPaymentCount: number;
  overduePaymentCount: number;
  collectionRate: number;
};

export type ClubAdminFinanceObligationFeedResponse = {
  clubId: number;
  clubName: string;
  items: ClubAdminFinanceObligation[];
  nextCursorObligationId: number | null;
  hasNext: boolean;
};

export type ClubAdminFinanceObligationDetailResponse = {
  obligation: ClubAdminFinanceObligation;
  payments: ClubFinancePayment[];
};

export type ClubFinanceUserObligation = {
  obligationId: number;
  obligationTypeCode: string;
  obligationTypeLabel: string;
  title: string;
  amount: number;
  amountLabel: string;
  currencyCode: string;
  dueAt: string | null;
  dueAtLabel: string | null;
  issuedAt: string | null;
  issuedAtLabel: string | null;
  note: string | null;
  financeAccountId: number | null;
  financeAccountName: string | null;
  linkedScheduleEventId: number | null;
  linkedScheduleEventTitle: string | null;
  recurrenceLabel: string;
  payment: ClubFinancePayment;
};

export type ClubFinanceHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  pendingPaymentCount: number;
  paidPaymentCount: number;
  overduePaymentCount: number;
  actionRequiredCount: number;
  totalPendingAmountLabel: string;
  totalPaidAmountLabel: string;
  recentPayments: ClubFinanceUserObligation[];
  nextPayableObligation: ClubFinanceUserObligation | null;
  openObligations: ClubFinanceUserObligation[];
  paymentHistory: ClubFinanceUserObligation[];
  scheduleOptions: FinanceScheduleOption[];
};

export type ClubFinanceRequest = {
  requestId: number;
  requestTypeCode: "ADVANCE" | "REFUND_REQUEST" | "SETTLEMENT_REQUEST" | string;
  requestTypeLabel: string;
  requesterDisplayName: string;
  amount: number;
  amountLabel: string;
  currencyCode: string;
  title: string;
  linkedScheduleEventId: number | null;
  linkedScheduleEventTitle: string | null;
  relatedEventName: string | null;
  note: string | null;
  statusCode: "SUBMITTED" | "APPROVED" | "REJECTED" | string;
  statusLabel: string;
  submittedAt: string | null;
  submittedAtLabel: string | null;
  reviewedAt: string | null;
  reviewedAtLabel: string | null;
  reviewNote: string | null;
};

export type ClubFinanceRequestFeedResponse = {
  clubId: number;
  clubName: string;
  items: ClubFinanceRequest[];
};

export type CreateFinanceRequestRequest = {
  requestTypeCode: "ADVANCE" | "REFUND_REQUEST" | "SETTLEMENT_REQUEST" | string;
  title: string;
  amount: number;
  relatedEventName?: string | null;
  note?: string | null;
  linkedScheduleEventId?: number | null;
};

export type ReviewFinanceRequestRequest = {
  statusCode: "APPROVED" | "REJECTED" | string;
  reviewNote?: string | null;
};

export type ClubFinanceExpense = {
  expenseId: number;
  sourceRequestId: number | null;
  financePeriodId: number | null;
  financePeriodTitle: string | null;
  financeAccountId: number | null;
  financeAccountName: string | null;
  linkedScheduleEventId: number | null;
  linkedScheduleEventTitle: string | null;
  expenseTypeCode: string;
  expenseTypeLabel: string;
  categoryCode: string;
  categoryLabel: string;
  enteredByDisplayName: string;
  amount: number;
  amountLabel: string;
  currencyCode: string;
  title: string;
  relatedEventName: string | null;
  note: string | null;
  spentAt: string | null;
  spentAtLabel: string | null;
  statusCode: "POSTED" | "VOIDED" | string;
  voidReason: string | null;
};

export type ClubFinanceExpenseFeedResponse = {
  clubId: number;
  clubName: string;
  items: ClubFinanceExpense[];
};

export type CreateFinanceExpenseRequest = {
  title: string;
  categoryCode: string;
  amount: number;
  spentAt?: string | null;
  relatedEventName?: string | null;
  note?: string | null;
  financePeriodId?: number | null;
  financeAccountId?: number | null;
  linkedScheduleEventId?: number | null;
};

export type ClubAdminFinanceHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  canIssue: boolean;
  canMarkPaid: boolean;
  canMarkWaive: boolean;
  canManageBilling: boolean;
  canReviewRequests: boolean;
  canCreateExpenses: boolean;
  canUpdatePayments: boolean;
  canExport: boolean;
  canClosePeriods: boolean;
  activeMemberCount: number;
  totalObligationCount: number;
  totalPaymentCount: number;
  pendingPaymentCount: number;
  paidPaymentCount: number;
  waivedPaymentCount: number;
  overduePaymentCount: number;
  collectionRate: number;
  totalBilledAmountLabel: string;
  totalCollectedAmountLabel: string;
  totalOutstandingAmountLabel: string;
  totalWaivedAmountLabel: string;
  availableMembers: ClubFinanceMemberOption[];
};

export type CreateFinanceObligationRequest = {
  title: string;
  amount: number;
  dueAt?: string | null;
  note?: string | null;
  targetScopeCode?: "ALL_ACTIVE_MEMBERS" | "SELECTED_MEMBERS" | string;
  clubProfileIds?: number[];
  financePeriodId?: number | null;
  financeAccountId?: number | null;
  linkedScheduleEventId?: number | null;
  recurrenceFrequency?: "NONE" | "MONTHLY" | "YEARLY" | string;
  recurrenceInterval?: number;
  recurrenceEndDate?: string | null;
};

export type CreateFinanceObligationResponse = {
  obligationId: number;
  obligationTypeCode: string;
  title: string;
  targetScopeCode: string;
  targetScopeLabel: string;
  createdCount: number;
};

export type UpdateFinancePaymentStatusRequest = {
  paymentStatusCode: "PENDING" | "PAID" | "WAIVED" | string;
  note?: string | null;
  financeAccountId?: number | null;
  paymentMethodCode?: "TRANSFER" | "CASH" | "CARD" | "OTHER" | string | null;
};

export type FinanceAccount = {
  financeAccountId: number;
  displayName: string;
  accountTypeCode: "BANK" | "CASH" | "CARD" | "OTHER" | string;
  accountTypeLabel: string;
  providerName: string | null;
  maskedIdentifier: string | null;
  holderName: string | null;
  usageScopeCode: "COLLECTION" | "EXPENSE" | "BOTH" | string;
  usageScopeLabel: string;
  active: boolean;
  defaultCollection: boolean;
  defaultExpense: boolean;
};

export type FinanceBudget = {
  financeBudgetId: number;
  categoryCode: string;
  categoryLabel: string;
  allocatedAmount: number;
  allocatedAmountLabel: string;
  spentAmount: number;
  spentAmountLabel: string;
  remainingAmount: number;
  remainingAmountLabel: string;
  executionRate: number;
  note: string | null;
};

export type FinancePeriod = {
  financePeriodId: number;
  clubOperatingTermId: number | null;
  title: string;
  startDate: string;
  endDate: string;
  statusCode: "OPEN" | "CLOSED" | string;
  openingBalance: number;
  openingBalanceLabel: string;
  collectedAmount: number;
  collectedAmountLabel: string;
  spentAmount: number;
  spentAmountLabel: string;
  currentBalance: number;
  currentBalanceLabel: string;
  closingBalance: number | null;
  closingBalanceLabel: string | null;
  closedAt: string | null;
  note: string | null;
  budgets: FinanceBudget[];
};

export type FinanceScheduleOption = {
  eventId: number;
  title: string;
  startAt: string;
  startAtLabel: string;
};

export type ClubFinanceOperationsResponse = {
  clubId: number;
  clubName: string;
  canManageBilling: boolean;
  canReviewRequests: boolean;
  canCreateExpenses: boolean;
  canUpdatePayments: boolean;
  canExport: boolean;
  canClosePeriods: boolean;
  accounts: FinanceAccount[];
  periods: FinancePeriod[];
  scheduleOptions: FinanceScheduleOption[];
};

export type UpsertFinanceAccountRequest = {
  displayName: string;
  accountTypeCode: "BANK" | "CASH" | "CARD" | "OTHER" | string;
  providerName?: string | null;
  maskedIdentifier?: string | null;
  holderName?: string | null;
  usageScopeCode: "COLLECTION" | "EXPENSE" | "BOTH" | string;
  defaultCollection: boolean;
  defaultExpense: boolean;
};

export type CreateFinancePeriodRequest = {
  title: string;
  startDate: string;
  endDate: string;
  clubOperatingTermId?: number | null;
  openingBalance?: number | null;
  note?: string | null;
};

export type UpsertFinanceBudgetRequest = {
  categoryCode: string;
  allocatedAmount: number;
  note?: string | null;
};

export type CorrectFinanceExpenseRequest = {
  title: string;
  categoryCode: string;
  amount: number;
  spentAt?: string | null;
  financePeriodId?: number | null;
  financeAccountId?: number | null;
  linkedScheduleEventId?: number | null;
  relatedEventName?: string | null;
  note?: string | null;
  reason: string;
};

export type FinanceExpenseRevision = {
  financeExpenseRevisionId: number;
  revisionTypeCode: "CORRECTION" | "VOID" | string;
  revisedByDisplayName: string;
  previousAmount: number;
  nextAmount: number | null;
  previousTitle: string;
  nextTitle: string | null;
  previousCategoryCode: string;
  nextCategoryCode: string | null;
  previousSpentAt: string;
  nextSpentAt: string | null;
  previousFinancePeriodId: number | null;
  nextFinancePeriodId: number | null;
  previousFinanceAccountId: number | null;
  nextFinanceAccountId: number | null;
  previousScheduleEventId: number | null;
  nextScheduleEventId: number | null;
  previousStatusCode: string;
  nextStatusCode: string;
  reason: string;
  revisedAt: string;
};

export function getClubFinance(clubId: ClubId) {
  return getJson<ClubFinanceHomeResponse>(`/api/semo/v1/clubs/${clubId}/more/finance`);
}

export function getClubFinanceRequests(clubId: ClubId) {
  return getJson<ClubFinanceRequestFeedResponse>(`/api/semo/v1/clubs/${clubId}/more/finance/requests`);
}

export function createClubFinanceRequest(clubId: ClubId, request: CreateFinanceRequestRequest) {
  return postJson<ClubFinanceRequest>(`/api/semo/v1/clubs/${clubId}/more/finance/requests`, request);
}

export function getClubAdminFinance(clubId: ClubId) {
  return getJson<ClubAdminFinanceHomeResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/finance`);
}

export function getClubFinanceOperations(clubId: ClubId) {
  return getJson<ClubFinanceOperationsResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/operations`,
  );
}

export function createClubFinanceAccount(clubId: ClubId, request: UpsertFinanceAccountRequest) {
  return postJson<FinanceAccount>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/accounts`,
    request,
  );
}

export function updateClubFinanceAccount(
  clubId: ClubId,
  financeAccountId: string | number,
  request: UpsertFinanceAccountRequest,
) {
  return putJson<FinanceAccount>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/accounts/${financeAccountId}`,
    request,
  );
}

export function deactivateClubFinanceAccount(
  clubId: ClubId,
  financeAccountId: string | number,
) {
  return deleteJson<FinanceAccount>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/accounts/${financeAccountId}`,
  );
}

export function createClubFinancePeriod(clubId: ClubId, request: CreateFinancePeriodRequest) {
  return postJson<FinancePeriod>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/periods`,
    request,
  );
}

export function upsertClubFinanceBudget(
  clubId: ClubId,
  financePeriodId: string | number,
  request: UpsertFinanceBudgetRequest,
) {
  return putJson<FinancePeriod>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/periods/${financePeriodId}/budgets`,
    request,
  );
}

export function closeClubFinancePeriod(clubId: ClubId, financePeriodId: string | number) {
  return postJson<FinancePeriod>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/periods/${financePeriodId}/close`,
    undefined,
  );
}

export function exportClubFinanceCsv(clubId: ClubId, financePeriodId?: number | null) {
  const query = financePeriodId == null ? "" : `?financePeriodId=${financePeriodId}`;
  return getJson<string>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/export.csv${query}`,
  );
}

export function getClubAdminFinanceRequests(clubId: ClubId) {
  return getJson<ClubFinanceRequestFeedResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/finance/requests`);
}

export function reviewClubFinanceRequest(
  clubId: ClubId,
  requestId: string | number,
  request: ReviewFinanceRequestRequest,
) {
  return postJson<ClubFinanceRequest>(`/api/semo/v1/clubs/${clubId}/admin/more/finance/requests/${requestId}/review`, request);
}

export function getClubAdminFinanceExpenses(clubId: ClubId) {
  return getJson<ClubFinanceExpenseFeedResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/finance/expenses`);
}

export function createClubAdminFinanceExpense(clubId: ClubId, request: CreateFinanceExpenseRequest) {
  return postJson<ClubFinanceExpense>(`/api/semo/v1/clubs/${clubId}/admin/more/finance/expenses`, request);
}

export function getClubFinanceExpenseRevisions(clubId: ClubId, expenseId: string | number) {
  return getJson<FinanceExpenseRevision[]>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/expenses/${expenseId}/revisions`,
  );
}

export function correctClubFinanceExpense(
  clubId: ClubId,
  expenseId: string | number,
  request: CorrectFinanceExpenseRequest,
) {
  return putJson<ClubFinanceExpense>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/expenses/${expenseId}`,
    request,
  );
}

export function voidClubFinanceExpense(
  clubId: ClubId,
  expenseId: string | number,
  reason: string,
) {
  return postJson<ClubFinanceExpense>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/expenses/${expenseId}/void`,
    { reason },
  );
}

export function getClubAdminFinanceObligations(
  clubId: ClubId,
  options: {
    query?: string;
    obligationFilter?: "ALL" | "OPEN" | "SETTLED" | string;
    cursorObligationId?: number | null;
    size?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.query?.trim()) {
    params.set("query", options.query.trim());
  }
  if (options.obligationFilter && options.obligationFilter !== "ALL") {
    params.set("obligationFilter", options.obligationFilter);
  }
  if (options.cursorObligationId != null) {
    params.set("cursorObligationId", String(options.cursorObligationId));
  }
  if (options.size != null) {
    params.set("size", String(options.size));
  }
  const queryString = params.toString();
  return getJson<ClubAdminFinanceObligationFeedResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/finance/obligations${queryString ? `?${queryString}` : ""}`,
  );
}

export function getClubAdminFinanceObligationDetail(clubId: ClubId, obligationId: string | number) {
  return getJson<ClubAdminFinanceObligationDetailResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/finance/obligations/${obligationId}/payments`);
}

export function createClubFinanceObligation(clubId: ClubId, request: CreateFinanceObligationRequest) {
  return postJson<CreateFinanceObligationResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/finance/obligations`, request);
}

export function deleteClubFinanceObligation(clubId: ClubId, obligationId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/admin/more/finance/obligations/${obligationId}`);
}

export function updateClubFinancePaymentStatus(
  clubId: ClubId,
  paymentId: string | number,
  request: UpdateFinancePaymentStatusRequest,
) {
  return patchJson<ClubFinancePayment>(`/api/semo/v1/clubs/${clubId}/admin/more/finance/payments/${paymentId}/status`, request);
}
