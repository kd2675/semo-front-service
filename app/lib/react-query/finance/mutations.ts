import { mutationOptions } from "@tanstack/react-query";
import {
  createClubAdminFinanceExpense,
  createClubFinanceObligation,
  createClubFinanceRequest,
  deleteClubFinanceObligation,
  reviewClubFinanceRequest,
  updateClubFinancePaymentStatus,
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
    mutationFn: ({
      paymentId,
      paymentStatusCode,
    }: {
      paymentId: number;
      paymentStatusCode: Parameters<typeof updateClubFinancePaymentStatus>[2]["paymentStatusCode"];
    }) => updateClubFinancePaymentStatus(clubId, paymentId, { paymentStatusCode }),
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
