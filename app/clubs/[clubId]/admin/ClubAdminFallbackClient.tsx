"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClubAdminHomeClient } from "./ClubAdminHomeClient";
import { AdminHomeLoadingShell } from "./AdminRouteLoadingShells";
import { getMyClub, type MyClubSummary } from "@/app/lib/clubs";

type ClubAdminFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFallbackClient({ clubId }: ClubAdminFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getMyClub(clubId);
      if (cancelled || !result.ok || !result.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!result.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      setClub(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  const metrics = useMemo(
    () => [
      {
        id: "members",
        label: "전체 멤버",
        value: "1,284",
        accent: "primary" as const,
        detail: "이번 달 +12%",
        detailIcon: "trending_up",
        detailTone: "green" as const,
      },
      {
        id: "events",
        label: "진행 중 일정",
        value: "8",
        detail: "오늘 시작 3건",
        detailIcon: "schedule",
        detailTone: "slate" as const,
      },
      {
        id: "approvals",
        label: "승인 대기",
        value: "24",
        accent: "orange" as const,
        detail: "확인 필요",
        detailIcon: "priority_high",
        detailTone: "orange" as const,
      },
      {
        id: "revenue",
        label: "당월 매출",
        value: "420만원",
        detail: "회비/행사 기준",
        detailIcon: "payments",
        detailTone: "slate" as const,
      },
    ],
    [],
  );

  const actions = useMemo(
    () => [
      {
        id: "menu",
        title: "메뉴 관리",
        description: "앱 기능, 탭, 레이아웃을 설정합니다.",
        icon: "widgets",
        href: `/clubs/${clubId}/admin/menu`,
      },
      {
        id: "members",
        title: "멤버 관리",
        description: "멤버, 권한, 활동 상태를 한 번에 관리합니다.",
        icon: "groups",
        href: `/clubs/${clubId}/admin/members`,
      },
      {
        id: "stats",
        title: "통계",
        description: "모임 성장과 참여 지표를 시각화합니다.",
        icon: "analytics",
        href: `/clubs/${clubId}/admin/stats`,
      },
    ],
    [clubId],
  );

  const activities = useMemo(
    () => [
      {
        id: "permission",
        actor: "관리자 마커스",
        action: "수정",
        target: "권한: 모더레이터",
        timeAgo: "2분 전",
        avatarLabel: "마",
      },
      {
        id: "approval",
        actor: "시스템",
        action: "자동 승인",
        target: "신규 멤버 신청 12건",
        timeAgo: "1시간 전",
        avatarLabel: "시",
      },
      {
        id: "request",
        actor: "데이비드 첸",
        action: "요청",
        target: "기능 요청: 다크 모드",
        timeAgo: "3시간 전",
        avatarLabel: "데",
      },
    ],
    [],
  );

  if (!club) {
    return <AdminHomeLoadingShell />;
  }

  return (
    <ClubAdminHomeClient
      clubName={club.name}
      metrics={metrics}
      actions={actions}
      activities={activities}
    />
  );
}
