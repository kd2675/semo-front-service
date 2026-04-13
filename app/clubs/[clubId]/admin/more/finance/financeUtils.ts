import type {
  ClubAdminFinanceObligation,
  ClubFinancePayment,
  ClubFinanceRequest,
} from "@/app/lib/clubs";

export function getPaymentStatusClassName(payment: ClubFinancePayment) {
  if (payment.paymentStatusCode === "PAID") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (payment.paymentStatusCode === "WAIVED") {
    return "bg-slate-200 text-slate-600";
  }
  if (payment.paymentStatusCode === "OVERDUE") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-amber-50 text-amber-700";
}

export function getObligationFrameClassName(obligation: ClubAdminFinanceObligation) {
  if (obligation.overduePaymentCount > 0) {
    return "border-rose-200 bg-rose-50/30";
  }
  if (obligation.pendingPaymentCount > 0) {
    return "border-amber-200 bg-amber-50/30";
  }
  return "border-emerald-200 bg-emerald-50/20";
}

export function getFinanceRequestStatusClassName(request: ClubFinanceRequest) {
  if (request.statusCode === "APPROVED") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (request.statusCode === "REJECTED") {
    return "bg-rose-50 text-rose-600";
  }
  return "bg-sky-50 text-sky-700";
}
