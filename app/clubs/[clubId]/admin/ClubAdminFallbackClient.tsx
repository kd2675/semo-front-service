"use client";

import { useQueries } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ClubAdminHomeClient } from "./ClubAdminHomeClient";
import { AdminHomeLoadingShell } from "./AdminRouteLoadingShells";
import { adminActivitiesPreviewQueryOptions } from "@/app/lib/react-query/activities/queries";
import {
  adminJoinRequestInboxQueryOptions,
  adminMembersQueryOptions,
} from "@/app/lib/react-query/members/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";

type ClubAdminFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFallbackClient({ clubId }: ClubAdminFallbackClientProps) {
  const router = useRouter();
  const [clubQuery, membersQuery, joinRequestsQuery, activitiesQuery] = useQueries({
    queries: [
      myClubQueryOptions(clubId),
      adminMembersQueryOptions(clubId),
      adminJoinRequestInboxQueryOptions(clubId),
      adminActivitiesPreviewQueryOptions(clubId, 5),
    ],
  });
  const club = clubQuery.data ?? null;
  const membersPayload = membersQuery.data ?? null;
  const joinRequestsPayload = joinRequestsQuery.data ?? null;
  const activities = activitiesQuery.data?.activities ?? [];

  useEffect(() => {
    if (
      !clubQuery.isPending &&
      !membersQuery.isPending &&
      !joinRequestsQuery.isPending &&
      (clubQuery.isError ||
        membersQuery.isError ||
        joinRequestsQuery.isError ||
        !club ||
        !membersPayload ||
        !joinRequestsPayload ||
        !club.admin)
    ) {
        router.replace(`/clubs/${clubId}`);
    }
  }, [
    club,
    clubId,
    clubQuery.isError,
    clubQuery.isPending,
    joinRequestsPayload,
    joinRequestsQuery.isError,
    joinRequestsQuery.isPending,
    membersPayload,
    membersQuery.isError,
    membersQuery.isPending,
    router,
  ]);

  const metrics = useMemo(
    () => {
      const members = membersPayload?.members ?? [];
      const pendingCount = joinRequestsPayload?.pendingRequestCount ?? 0;
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
    [joinRequestsPayload, membersPayload],
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
        id: "join-requests",
        title: "신규가입",
        description: "가입 신청 대기열을 확인하고 승인, 반려를 처리합니다.",
        icon: "group_add",
        href: `/clubs/${clubId}/admin/more/join-requests`,
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
    ],
    [clubId],
  );

  if (!club || !membersPayload || !joinRequestsPayload) {
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
