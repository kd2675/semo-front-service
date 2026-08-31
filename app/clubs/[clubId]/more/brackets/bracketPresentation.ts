export function approvalBadgeClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "REJECTED":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function approvalLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return "승인 완료";
    case "PENDING":
      return "승인 대기";
    case "REJECTED":
      return "반려";
    default:
      return "초안";
  }
}

export function sourceLabel(sourceType: string) {
  return sourceType === "TOURNAMENT" ? "대회 불러오기" : "직접 작성";
}
