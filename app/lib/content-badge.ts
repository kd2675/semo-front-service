type LinkedTargetType = "SCHEDULE_EVENT" | "POLL" | null | undefined;
type ShareTargetBadgeOptions = {
  postedToBoard?: boolean | null;
  postedToCalendar?: boolean | null;
  includeBoard?: boolean;
};

export type ContentBadge = {
  label: string;
  className: string;
};

export function getLinkedContentBadge(type: LinkedTargetType): ContentBadge {
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

export function getShareTargetBadges({
  postedToBoard,
  postedToCalendar,
  includeBoard = true,
}: ShareTargetBadgeOptions): ContentBadge[] {
  const badges: ContentBadge[] = [];

  if (includeBoard && postedToBoard) {
    badges.push({
      label: "게시판",
      className: "bg-sky-50 text-sky-600",
    });
  }

  if (postedToCalendar) {
    badges.push({
      label: "캘린더",
      className: "bg-indigo-50 text-indigo-600",
    });
  }

  return badges;
}
