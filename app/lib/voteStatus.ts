type VoteStatus = "WAITING" | "ONGOING" | "CLOSED";

export function getVoteLifecycleLabel(voteStatus: VoteStatus) {
  if (voteStatus === "CLOSED") {
    return "마감";
  }
  if (voteStatus === "WAITING") {
    return "대기";
  }
  return "진행 중";
}

export function getVoteLifecycleBadgeClassName(voteStatus: VoteStatus) {
  if (voteStatus === "CLOSED") {
    return "bg-slate-100 text-slate-500";
  }
  if (voteStatus === "WAITING") {
    return "bg-amber-50 text-amber-600";
  }
  return "bg-blue-50 text-blue-600";
}
