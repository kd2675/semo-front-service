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
        label: "Total Members",
        value: "1,284",
        accent: "primary" as const,
        detail: "+12% this month",
        detailIcon: "trending_up",
        detailTone: "green" as const,
      },
      {
        id: "events",
        label: "Active Events",
        value: "8",
        detail: "3 starting today",
        detailIcon: "schedule",
        detailTone: "slate" as const,
      },
      {
        id: "approvals",
        label: "Pending Approvals",
        value: "24",
        accent: "orange" as const,
        detail: "Needs attention",
        detailIcon: "priority_high",
        detailTone: "orange" as const,
      },
      {
        id: "revenue",
        label: "Revenue (MTD)",
        value: "$4.2k",
        detail: "From dues/events",
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
        title: "Menu Management",
        description: "Configure app features, tabs, and layout.",
        icon: "widgets",
        href: `/clubs/${clubId}/admin/menu`,
      },
      {
        id: "members",
        title: "Member Management",
        description: "Manage members, roles, and activity status in one place.",
        icon: "groups",
        href: `/clubs/${clubId}/admin/members`,
      },
      {
        id: "stats",
        title: "Global Stats",
        description: "Visualize club growth and engagement data.",
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
        actor: "Admin Marcus",
        action: "updated",
        target: "Permission: Moderator",
        timeAgo: "2 minutes ago",
        avatarLabel: "AM",
      },
      {
        id: "approval",
        actor: "System",
        action: "auto-approved",
        target: "12 new member applications",
        timeAgo: "1 hour ago",
        avatarLabel: "SY",
      },
      {
        id: "request",
        actor: "David Chen",
        action: "requested",
        target: "Feature Request: Dark Mode",
        timeAgo: "3 hours ago",
        avatarLabel: "DC",
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
