type LinkedTargetType = "SCHEDULE_EVENT" | "POLL" | null | undefined;

export function getLinkedContentBadge(type: LinkedTargetType) {
  if (type === "SCHEDULE_EVENT") {
    return {
      label: "일정",
      className: "bg-amber-50 text-amber-600",
    };
  }
  if (type === "POLL") {
    return {
      label: "투표",
      className: "bg-violet-50 text-violet-600",
    };
  }
  return {
    label: "공지",
    className: "bg-blue-50 text-blue-600",
  };
}
