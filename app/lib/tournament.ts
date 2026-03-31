import type { TournamentSummary, TournamentDetailResponse } from "@/app/lib/clubs";

type TournamentLike = Pick<
  TournamentSummary | TournamentDetailResponse,
  "approvalStatus" | "tournamentStatus" | "matchFormat" | "feeRequired" | "feeAmount" | "feeCurrencyCode"
>;

export function getTournamentApprovalLabel(status: TournamentLike["approvalStatus"]) {
  switch (status) {
    case "APPROVED":
      return "승인됨";
    case "REJECTED":
      return "거절됨";
    default:
      return "승인 대기";
  }
}

export function getTournamentApprovalBadgeClassName(status: TournamentLike["approvalStatus"]) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-violet-50 text-violet-700";
  }
}

export function getTournamentStatusLabel(status: TournamentLike["tournamentStatus"]) {
  switch (status) {
    case "APPLICATION_OPEN":
      return "모집 중";
    case "ENTRY_CONFIRMED":
      return "준비 중";
    case "ONGOING":
      return "진행 중";
    case "COMPLETED":
      return "종료";
    case "CANCELLED":
      return "취소";
    default:
      return "준비 중";
  }
}

export function getTournamentStatusBadgeClassName(status: TournamentLike["tournamentStatus"]) {
  switch (status) {
    case "APPLICATION_OPEN":
      return "bg-amber-50 text-amber-700";
    case "ENTRY_CONFIRMED":
      return "bg-sky-50 text-sky-700";
    case "ONGOING":
      return "bg-emerald-50 text-emerald-700";
    case "COMPLETED":
      return "bg-slate-100 text-slate-600";
    case "CANCELLED":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-indigo-50 text-indigo-600";
  }
}

export function getTournamentFormatLabel(matchFormat: TournamentLike["matchFormat"]) {
  switch (matchFormat) {
    case "DOUBLE":
      return "복식";
    case "TEAM":
      return "단체전";
    default:
      return "개인전";
  }
}

export function getTournamentFeeLabel(item: TournamentLike) {
  if (!item.feeRequired) {
    return "Free";
  }
  if (item.feeAmount == null) {
    return "유료";
  }
  const currency = item.feeCurrencyCode || "KRW";
  if (currency === "KRW") {
    return `${new Intl.NumberFormat("ko-KR").format(item.feeAmount)}원`;
  }
  return `${currency} ${new Intl.NumberFormat("en-US").format(item.feeAmount)}`;
}
