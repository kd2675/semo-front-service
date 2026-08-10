const CLUB_ROLE_LABELS: Record<string, string> = {
  OWNER: "오너",
  ADMIN: "관리자",
  MEMBER: "멤버",
  INACTIVE: "비활성 멤버",
};

const MEMBERSHIP_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "활동 중",
  PENDING: "가입 대기",
  INACTIVE: "비활성",
  WITHDRAWN: "탈퇴",
};

export function getClubRoleLabel(roleCode: string | null | undefined) {
  if (!roleCode) {
    return "멤버";
  }

  return CLUB_ROLE_LABELS[roleCode] ?? "기타 역할";
}

export function getMembershipStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "활동 중";
  }

  return MEMBERSHIP_STATUS_LABELS[status] ?? "상태 확인 필요";
}
