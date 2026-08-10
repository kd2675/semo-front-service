import { mutationOptions } from "@tanstack/react-query";
import {
  createClubAdminFinanceExpense,
  createClubFinanceAccount,
  createClubFinancePeriod,
  createClubFinanceObligation,
  createClubFinanceRequest,
  deleteClubFinanceObligation,
  reviewClubFinanceRequest,
  correctClubFinanceExpense,
  deactivateClubFinanceAccount,
  closeClubFinancePeriod,
  upsertClubFinanceBudget,
  updateClubFinanceAccount,
  updateClubFinancePaymentStatus,
  voidClubFinanceExpense,
} from "@/app/lib/clubs";

export function createFinanceRequestMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubFinanceRequest>[1]) =>
      createClubFinanceRequest(clubId, request),
  });
}

export function createFinanceObligationMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubFinanceObligation>[1]) =>
      createClubFinanceObligation(clubId, request),
  });
}

export function createAdminFinanceExpenseMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubAdminFinanceExpense>[1]) =>
      createClubAdminFinanceExpense(clubId, request),
  });
}

export function updateFinancePaymentStatusMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({ paymentId, ...request }: {
      paymentId: number;
    } & Parameters<typeof updateClubFinancePaymentStatus>[2]) =>
      updateClubFinancePaymentStatus(clubId, paymentId, request),
  });
}

export function createFinanceAccountMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubFinanceAccount>[1]) =>
      createClubFinanceAccount(clubId, request),
  });
}

export function updateFinanceAccountMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({ financeAccountId, request }: {
      financeAccountId: number;
      request: Parameters<typeof updateClubFinanceAccount>[2];
    }) => updateClubFinanceAccount(clubId, financeAccountId, request),
  });
}

export function deactivateFinanceAccountMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (financeAccountId: number) =>
      deactivateClubFinanceAccount(clubId, financeAccountId),
  });
}

export function createFinancePeriodMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (request: Parameters<typeof createClubFinancePeriod>[1]) =>
      createClubFinancePeriod(clubId, request),
  });
}

export function upsertFinanceBudgetMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({ financePeriodId, request }: {
      financePeriodId: number;
      request: Parameters<typeof upsertClubFinanceBudget>[2];
    }) => upsertClubFinanceBudget(clubId, financePeriodId, request),
  });
}

export function closeFinancePeriodMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (financePeriodId: number) => closeClubFinancePeriod(clubId, financePeriodId),
  });
}

export function correctFinanceExpenseMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({ expenseId, request }: {
      expenseId: number;
      request: Parameters<typeof correctClubFinanceExpense>[2];
    }) => correctClubFinanceExpense(clubId, expenseId, request),
  });
}

export function voidFinanceExpenseMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({ expenseId, reason }: { expenseId: number; reason: string }) =>
      voidClubFinanceExpense(clubId, expenseId, reason),
  });
}

export function deleteFinanceObligationMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (obligationId: number) => deleteClubFinanceObligation(clubId, obligationId),
  });
}

export function reviewFinanceRequestMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({
      requestId,
      statusCode,
      reviewNote,
    }: {
      requestId: number;
      statusCode: Parameters<typeof reviewClubFinanceRequest>[2]["statusCode"];
      reviewNote: string | null;
    }) => reviewClubFinanceRequest(clubId, requestId, { statusCode, reviewNote }),
  });
}
