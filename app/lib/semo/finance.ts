import { deleteJson, getJson, patchJson, postJson } from "@/app/lib/api";

type ClubId = string | number;

export type ClubFinancePayment = {
  paymentId: number;
  clubProfileId: number;
  memberDisplayName: string;
  memberRoleCode: string | null;
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
};

export type ReviewFinanceRequestRequest = {
  statusCode: "APPROVED" | "REJECTED" | string;
  reviewNote?: string | null;
};

export type ClubFinanceExpense = {
  expenseId: number;
  sourceRequestId: number | null;
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
};

export type ClubAdminFinanceHomeResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  canIssue: boolean;
  canMarkPaid: boolean;
  canMarkWaive: boolean;
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
