import { notFound } from "next/navigation";
import { ClubAdminFallbackClient } from "./ClubAdminFallbackClient";
import { ClubAdminHomeClient } from "./ClubAdminHomeClient";
import { CLUB_DASHBOARDS, getClubDashboard } from "@/app/lib/mock-clubs";

type ClubAdminPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export async function generateStaticParams() {
  return CLUB_DASHBOARDS.filter((club) => club.isAdmin).map((club) => ({ clubId: club.id }));
}

export default async function ClubAdminPage({ params }: ClubAdminPageProps) {
  const { clubId } = await params;
  const club = getClubDashboard(clubId);

  if (!club) {
    return <ClubAdminFallbackClient clubId={clubId} />;
  }

  if (!club.isAdmin) {
    notFound();
  }

  return (
    <ClubAdminHomeClient
      clubName={club.name}
      metrics={[
        {
          id: "members",
          label: "Total Members",
          value: "1,284",
          accent: "primary",
          detail: "+12% this month",
          detailIcon: "trending_up",
          detailTone: "green",
        },
        {
          id: "events",
          label: "Active Events",
          value: "8",
          detail: "3 starting today",
          detailIcon: "schedule",
          detailTone: "slate",
        },
        {
          id: "approvals",
          label: "Pending Approvals",
          value: "24",
          accent: "orange",
          detail: "Needs attention",
          detailIcon: "priority_high",
          detailTone: "orange",
        },
        {
          id: "revenue",
          label: "Revenue (MTD)",
          value: "$4.2k",
          detail: "From dues/events",
          detailIcon: "payments",
          detailTone: "slate",
        },
      ]}
      actions={[
        {
          id: "menu",
          title: "Menu Management",
          description: "Configure app features, tabs, and layout.",
          icon: "widgets",
          href: `/clubs/${club.id}/admin/menu`,
        },
        {
          id: "members",
          title: "Member Management",
          description: "Manage members, roles, and activity status in one place.",
          icon: "groups",
          href: `/clubs/${club.id}/admin/members`,
        },
        {
          id: "stats",
          title: "Global Stats",
          description: "Visualize club growth and engagement data.",
          icon: "analytics",
          href: `/clubs/${club.id}/admin/stats`,
        },
      ]}
      activities={[
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
      ]}
    />
  );
}
