import type { ClubFeatureSummary } from "@/app/lib/clubs";

const FEATURE_LABELS: Record<string, string> = {
  JOIN_REQUEST: "가입 신청",
  ATTENDANCE: "일정 참석",
  NOTICE: "게시판 공지",
  POLL: "투표",
  SCHEDULE_MANAGE: "일정",
  TOURNAMENT_RECORD: "대회 운영",
  BRACKET: "대진표 초안",
  FINANCE: "회비·정산",
  FEEDBACK: "피드백",
  MEMBER_DIRECTORY: "멤버·조직",
  TODO: "할 일",
  ROLE_MANAGEMENT: "직책·권한",
  HANDOVER: "인수인계 센터",
  DECISION_LOG: "회의록·결정",
};

export function getFeatureDisplayName(feature: ClubFeatureSummary) {
  return FEATURE_LABELS[feature.featureKey] ?? feature.displayName;
}
