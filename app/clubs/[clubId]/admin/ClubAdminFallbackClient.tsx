"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClubAdminHomeClient } from "./ClubAdminHomeClient";
import { AdminHomeLoadingShell } from "./AdminRouteLoadingShells";
import { adminActivitiesPreviewQueryOptions } from "@/app/lib/react-query/activities/queries";
import { adminMembersQueryOptions } from "@/app/lib/react-query/members/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";

type ClubAdminFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFallbackClient({ clubId }: ClubAdminFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, membersQuery, activitiesQuery] = useQueries({
    queries: [
      myClubQueryOptions(clubId),
      adminMembersQueryOptions(clubId),
      adminActivitiesPreviewQueryOptions(clubId, 5),
    ],
  });
  const club = clubQuery.data ?? null;
  const membersPayload = membersQuery.data ?? null;
  const activities = useMemo(
    () => activitiesQuery.data?.activities ?? [],
    [activitiesQuery.data],
  );

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !membersQuery.isPending &&
      (clubQuery.isError || membersQuery.isError || !club || !membersPayload || !club.admin)
    ) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    membersPayload,
    membersQuery.isError,
    membersQuery.isPending,
    router,
  ]);

  const metrics = useMemo(
    () => {
      const members = membersPayload?.members ?? [];
      const activeCount = members.filter((member) => member.membershipStatus === "ACTIVE").length;
      const failureCount = activities.filter((activity) => activity.status === "FAIL").length;

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
        id: "activity",
        label: "최근 활동",
        value: activities.length.toLocaleString("ko-KR"),
        accent: failureCount > 0 ? ("orange" as const) : ("default" as const),
        detail: failureCount > 0 ? `실패 ${failureCount}건 확인 필요` : "최근 운영 로그 기준",
        detailIcon: failureCount > 0 ? "warning" : "history",
        detailTone: failureCount > 0 ? ("orange" as const) : ("slate" as const),
      },
    ];
    },
    [activities, membersPayload],
  );

  const actions = useMemo(
    () => [
      {
        id: "settings",
        title: "기본 정보",
        description: "모임 분류와 대표 활동 지역을 관리합니다.",
        icon: "tune",
        href: `/clubs/${clubId}/admin/settings`,
      },
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
        description: "가입 완료 멤버의 권한과 활동 상태를 관리합니다.",
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
      {
        id: "logs",
        title: "활동 로그",
        description: "운영 기록과 실패 이력을 확인합니다.",
        icon: "history",
        href: `/clubs/${clubId}/admin/logs`,
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
