"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClubAdminHomeClient } from "./ClubAdminHomeClient";
import { AdminHomeLoadingShell } from "./AdminRouteLoadingShells";
import {
  getClubAdminActivities,
  getClubAdminMembers,
  getMyClub,
  type ClubAdminActivityItem,
  type ClubAdminMembersResponse,
  type MyClubSummary,
} from "@/app/lib/clubs";

type ClubAdminFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFallbackClient({ clubId }: ClubAdminFallbackClientProps) {
  const router = useRouter();
  const [club, setClub] = useState<MyClubSummary | null>(null);
  const [membersPayload, setMembersPayload] = useState<ClubAdminMembersResponse | null>(null);
  const [activities, setActivities] = useState<ClubAdminActivityItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const [clubResult, membersResult, activitiesResult] = await Promise.all([
        getMyClub(clubId),
        getClubAdminMembers(clubId),
        getClubAdminActivities(clubId, { size: 5 }),
      ]);

      if (cancelled || !clubResult.ok || !clubResult.data || !membersResult.ok || !membersResult.data) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      if (!clubResult.data.admin) {
        router.replace(`/clubs/${clubId}`);
        return;
      }

      setClub(clubResult.data);
      setMembersPayload(membersResult.data);
      setActivities(activitiesResult.ok && activitiesResult.data ? activitiesResult.data.activities : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, router]);

  const metrics = useMemo(
    () => {
      const members = membersPayload?.members ?? [];
      const pendingCount = members.filter((member) => member.membershipStatus === "PENDING").length;
      const activeCount = members.filter((member) => member.membershipStatus === "ACTIVE").length;

      return [
      {
        id: "members",
        label: "전체 멤버",
        value: members.length.toLocaleString("ko-KR"),
        accent: "primary" as const,
        detail: `활성 멤버 ${activeCount.toLocaleString("ko-KR")}명`,
        detailIcon: "groups",
        detailTone: "slate" as const,
      },
      {
        id: "approvals",
        label: "승인 대기",
        value: pendingCount.toLocaleString("ko-KR"),
        accent: pendingCount > 0 ? ("orange" as const) : ("default" as const),
        detail: pendingCount > 0 ? "확인 필요" : "대기 신청 없음",
        detailIcon: pendingCount > 0 ? "priority_high" : "check_circle",
        detailTone: pendingCount > 0 ? ("orange" as const) : ("slate" as const),
      },
    ];
    },
    [membersPayload],
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

  if (!club || !membersPayload) {
    return <AdminHomeLoadingShell />;
  }

  return (
    <ClubAdminHomeClient
      clubId={clubId}
      clubName={club.name}
      metrics={metrics}
      actions={actions}
      activities={activities}
    />
  );
}
