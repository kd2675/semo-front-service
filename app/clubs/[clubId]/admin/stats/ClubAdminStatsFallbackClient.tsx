"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ClubRouteErrorState } from "@/app/components/ClubRouteState";
import { getQueryErrorMessage } from "@/app/lib/queryUtils";
import { adminActivitiesPreviewQueryOptions } from "@/app/lib/react-query/activities/queries";
import { myClubQueryOptions } from "@/app/lib/react-query/club/queries";
import { adminMembersQueryOptions } from "@/app/lib/react-query/members/queries";
import type {
  ClubAdminActivityItem,
  ClubAdminMembersResponse,
} from "@/app/lib/clubs";
import { AdminStatsLoadingShell } from "../AdminRouteLoadingShells";
import {
  type ClubAdminStatsActivity,
  type ClubAdminStatsMetric,
  type ClubAdminStatsSnapshotItem,
  ClubAdminStatsClient,
} from "./ClubAdminStatsClient";

type ClubAdminStatsFallbackClientProps = {
  clubId: string;
};

function isAdminRole(roleCode: string) {
  return roleCode === "OWNER" || roleCode === "ADMIN";
}

function toActivityItems(activities: ClubAdminActivityItem[]): ClubAdminStatsActivity[] {
  return activities.map((activity) => ({
    id: activity.activityId,
    subject: activity.subject,
    detail: activity.detail,
    status: activity.status,
    createdAtLabel: activity.createdAtLabel ?? "방금 전",
  }));
}

function buildMetrics(
  members: ClubAdminMembersResponse | null,
  activities: ClubAdminActivityItem[],
): ClubAdminStatsMetric[] {
  const memberItems = members?.members ?? [];
  const totalMemberCount = memberItems.length;
  const activeMemberCount = memberItems.filter((member) => member.membershipStatus === "ACTIVE").length;
  const dormantMemberCount = memberItems.filter((member) => member.membershipStatus === "DORMANT").length;
  const adminCount = memberItems.filter((member) => isAdminRole(member.roleCode)).length;
  const recentlyActiveCount = memberItems.filter((member) => member.lastActivityAtLabel != null).length;
  const failedActivityCount = activities.filter((activity) => activity.status === "FAIL").length;

  return [
    {
      id: "members-total",
      label: "전체 멤버",
      value: `${totalMemberCount}명`,
      detail: `활동 회원 ${activeMemberCount}명`,
      accent: "primary",
      icon: "groups",
    },
    {
      id: "members-dormant",
      label: "휴면 회원",
      value: `${dormantMemberCount}명`,
      detail: dormantMemberCount > 0 ? "재활성화 케어 필요" : "현재 휴면 회원 없음",
      accent: dormantMemberCount > 0 ? "red" : "default",
      icon: "bedtime",
    },
    {
      id: "admins",
      label: "운영진",
      value: `${adminCount}명`,
      detail: "오너 + 어드민 기준",
      accent: "green",
      icon: "admin_panel_settings",
    },
    {
      id: "recently-active",
      label: "최근 활동 멤버",
      value: `${recentlyActiveCount}명`,
      detail: "멤버 관리 마지막 활동 기준",
      accent: recentlyActiveCount > 0 ? "green" : "default",
      icon: "timeline",
    },
    {
      id: "activity-log-count",
      label: "최근 운영 로그",
      value: `${activities.length}건`,
      detail: failedActivityCount > 0 ? `실패 ${failedActivityCount}건 포함` : "최근 기록 기준",
      accent: failedActivityCount > 0 ? "red" : "default",
      icon: "history",
    },
  ];
}

function buildMemberSnapshotItems(members: ClubAdminMembersResponse | null): ClubAdminStatsSnapshotItem[] {
  const memberItems = members?.members ?? [];
  const activeMemberCount = memberItems.filter((member) => member.membershipStatus === "ACTIVE").length;
  const dormantMemberCount = memberItems.filter((member) => member.membershipStatus === "DORMANT").length;
  const ownerCount = memberItems.filter((member) => member.roleCode === "OWNER").length;
  const adminCount = memberItems.filter((member) => member.roleCode === "ADMIN").length;
  const pendingCount = memberItems.filter((member) => member.membershipStatus === "PENDING").length;

  return [
    {
      id: "member-active",
      label: "활동 회원",
      value: `${activeMemberCount}명`,
      detail: "현재 운영 대상",
      accent: "primary",
    },
    {
      id: "member-dormant",
      label: "휴면 회원",
      value: `${dormantMemberCount}명`,
      detail: dormantMemberCount > 0 ? "복귀 케어 필요" : "정상 상태",
      accent: dormantMemberCount > 0 ? "red" : "default",
    },
    {
      id: "member-owners",
      label: "오너",
      value: `${ownerCount}명`,
      detail: "최상위 운영 권한",
      accent: "green",
    },
    {
      id: "member-admins",
      label: "어드민",
      value: `${adminCount}명`,
      detail: "실무 운영 담당",
      accent: "green",
    },
    {
      id: "member-pending",
      label: "가입 미완료",
      value: `${pendingCount}명`,
      detail: "관리 범위 밖 상태 포함",
      accent: pendingCount > 0 ? "red" : "default",
    },
  ];
}

function buildMemberActivityItems(members: ClubAdminMembersResponse | null): ClubAdminStatsSnapshotItem[] {
  const memberItems = members?.members ?? [];
  const recentJoinCount = memberItems.filter((member) => member.joinedAtLabel != null).length;
  const noRecentActivityCount = memberItems.filter((member) => member.lastActivityAtLabel == null).length;
  const selfManagedCount = memberItems.filter((member) => member.self).length;
  const manageableCount = memberItems.filter((member) => member.canManage).length;

  return [
    {
      id: "member-joined",
      label: "가입 이력 보유",
      value: `${recentJoinCount}명`,
      detail: "멤버 관리 기준",
      accent: "default",
    },
    {
      id: "member-no-activity",
      label: "최근 활동 미표시",
      value: `${noRecentActivityCount}명`,
      detail: "활동 로그 점검 필요",
      accent: noRecentActivityCount > 0 ? "red" : "default",
    },
    {
      id: "member-manageable",
      label: "관리 가능 멤버",
      value: `${manageableCount}명`,
      detail: "권한 변경 가능 범위",
      accent: "primary",
    },
    {
      id: "member-self",
      label: "내 계정 포함",
      value: `${selfManagedCount}명`,
      detail: "본인 계정 식별",
      accent: "default",
    },
  ];
}

export function ClubAdminStatsFallbackClient({ clubId }: ClubAdminStatsFallbackClientProps) {
  const clubQuery = useQuery(myClubQueryOptions(clubId));
  const club = clubQuery.data ?? null;
  const isAdmin = club?.admin === true;

  const membersQuery = useQuery({
    ...adminMembersQueryOptions(clubId),
    enabled: isAdmin,
  });
  const activitiesQuery = useQuery({
    ...adminActivitiesPreviewQueryOptions(clubId, 5),
    enabled: isAdmin,
  });

  const members = membersQuery.data ?? null;
  const activities = useMemo(
    () => activitiesQuery.data?.activities ?? [],
    [activitiesQuery.data],
  );

  const isInitialLoading =
    clubQuery.isPending || (isAdmin && (membersQuery.isPending || activitiesQuery.isPending));

  const partialData = membersQuery.isError || activitiesQuery.isError;

  const metrics = useMemo(
    () => buildMetrics(members, activities),
    [activities, members],
  );
  const memberSnapshotItems = useMemo(
    () => buildMemberSnapshotItems(members),
    [members],
  );
  const memberActivityItems = useMemo(
    () => buildMemberActivityItems(members),
    [members],
  );
  const recentActivities = useMemo(() => toActivityItems(activities), [activities]);

  if (club && !club.admin) {
    return (
      <ClubRouteErrorState
        title="통계 대시보드"
        heading="관리자 권한이 필요합니다"
        message="클럽 통계는 관리자만 확인할 수 있습니다."
        backHref={`/clubs/${clubId}`}
        theme="admin"
        icon="lock"
      />
    );
  }

  if (clubQuery.isError && !club) {
    return (
      <ClubRouteErrorState
        title="통계 대시보드"
        message={getQueryErrorMessage(clubQuery.error, "클럽 통계를 불러오지 못했습니다.")}
        backHref={`/clubs/${clubId}/admin`}
        theme="admin"
        onRetry={() => void clubQuery.refetch()}
      />
    );
  }

  if (isInitialLoading || !club) {
    return <AdminStatsLoadingShell />;
  }

  return (
    <ClubAdminStatsClient
      clubName={club.name}
      partialData={partialData}
      metrics={metrics}
      memberSnapshotItems={memberSnapshotItems}
      memberActivityItems={memberActivityItems}
      recentActivities={recentActivities}
    />
  );
}
