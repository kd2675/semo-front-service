"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ClubAdminHomeClient } from "./ClubAdminHomeClient";
import { AdminHomeLoadingShell } from "./AdminRouteLoadingShells";
import {
  getClubAdminActivities,
  getClubAdminJoinRequests,
  getClubAdminMembers,
  getMyClub,
} from "@/app/lib/clubs";
import { unwrap } from "@/app/lib/query";
import { clubKeys, adminKeys } from "@/app/lib/queryKeys";

type ClubAdminFallbackClientProps = {
  clubId: string;
};

export function ClubAdminFallbackClient({ clubId }: ClubAdminFallbackClientProps) {
  const router = useRouter();

  const { data: club, isError: clubError } = useQuery({
    queryKey: clubKeys.detail(clubId),
    queryFn: () => unwrap(getMyClub(clubId)),
  });

  const isAdmin = club?.admin === true;

  const { data: membersPayload } = useQuery({
    queryKey: adminKeys.members(clubId),
    queryFn: () => unwrap(getClubAdminMembers(clubId)),
    enabled: isAdmin,
  });

  const { data: joinRequestsPayload } = useQuery({
    queryKey: adminKeys.joinRequests(clubId),
    queryFn: () => unwrap(getClubAdminJoinRequests(clubId)),
    enabled: isAdmin,
  });

  const { data: activitiesPayload } = useQuery({
    queryKey: adminKeys.activities(clubId, "home"),
    queryFn: async () => {
      const result = await getClubAdminActivities(clubId, { size: 5 });
      return result.ok && result.data ? result.data.activities : [];
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (clubError || (club && !isAdmin)) {
      router.replace(`/clubs/${clubId}`);
    }
  }, [clubError, club, isAdmin, clubId, router]);

  const metrics = useMemo(
    () => {
      const members = membersPayload?.members ?? [];
      const pendingCount = joinRequestsPayload?.requests.length ?? 0;
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

  if (!club || !membersPayload || !joinRequestsPayload) {
    return <AdminHomeLoadingShell />;
  }

  return (
    <ClubAdminHomeClient
      clubId={clubId}
      clubName={club.name}
      metrics={metrics}
      actions={actions}
      activities={activitiesPayload ?? []}
    />
  );
}
