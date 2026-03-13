import { notFound } from "next/navigation";
import { CLUB_DASHBOARDS, getClubDashboard } from "@/app/lib/mock-clubs";
import { ClubAdminMembersClient } from "./ClubAdminMembersClient";
import { ClubAdminMembersFallbackClient } from "./ClubAdminMembersFallbackClient";

type ClubAdminMembersPageProps = {
  params: Promise<{
    clubId: string;
  }>;
};

export async function generateStaticParams() {
  return CLUB_DASHBOARDS.filter((club) => club.isAdmin).map((club) => ({ clubId: club.id }));
}

export default async function ClubAdminMembersPage({ params }: ClubAdminMembersPageProps) {
  const { clubId } = await params;
  const club = getClubDashboard(clubId);

  if (!club) {
    return <ClubAdminMembersFallbackClient clubId={clubId} />;
  }

  if (!club.isAdmin) {
    notFound();
  }

  return (
    <ClubAdminMembersClient
      clubId={club.id}
      clubName={club.name}
      members={[
        {
          id: "kim",
          name: "김철수",
          joinedAt: "2023.10.15",
          attendanceRate: 95,
          role: "Admin",
          status: "활동 중",
          avatarUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBi6NxCypRdfYcYLg0KwPFFFC0vnMp6nLRY72Jnxmsd2j8SLcU_nsiifAjeK2EQNyPXoVQUhiVKcLQ4E2dfFUp4V79zyahyT231mZAFMcDBHl0pQ2IC88y-sBImVT28ROk_mHDjdPXFHsbwQzsCa1l75jbdOJjU__I8R0wxx95JKD5dExpws7faVW7mKPfluRCGkEqNb_z9Zb0YBSjF-Ujr-geJf-9xwZOAshHK6m6kvV-esqUQUYmhNSih0xrMMIGEfjnH00jF_4hS",
        },
        {
          id: "lee",
          name: "이지은",
          joinedAt: "2023.08.22",
          attendanceRate: 42,
          role: "Moderator",
          status: "휴면",
          avatarUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuALC-ese5dQNEwHNsvUfiIjwXkT1br8oBQzhAXy0gALYeolxNd3c1AMRFYeAHJPotwiRfGwAv1f3mnjd2H-GjOs1bFFdwseNp7yO8gzvwGp9B7lVXB8GK7G0X9s6mUVMB4vL-xCOlYuwOgUZcIyFA6Vy23Y7P4FCZVGzKHuylz-MRpytNjr6zomQV57Xk9EjxF9STlHzMgFdkiB8lau2cE40eiCL7NqfdWEKOi42a3FX-VlfdS-SHYQlMi8RuaWnx8Q0BhDTMieE-zm",
        },
        {
          id: "park",
          name: "박민준",
          joinedAt: "2024.01.05",
          attendanceRate: 88,
          role: "Member",
          status: "활동 중",
          avatarUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCY0tV2vY0LP7XJavt7h8mReKkWZZgxtlOj_sk6MSwA40jXqgzCvf9tXnb1nClZ7B-3s_mdMO9HXtsF0h8LM-lUmoFIkHuPWJm3e-lUxoHh8YWK8pY8FwOOIdJWDHze-JXejXlPnC-TmLQd3Ohphrl5aqYRXW23eGZH3P__q2eec2Z--LCa0R6GFIFy_ymwyBtrhdvvrlhiyqMwv6jpI6tqghpwuB8k6oMLcZFklCGa7wTfn5kxUhK92EzTgf_kNZuhxwFKLpqvEqIo",
        },
        {
          id: "jung",
          name: "정수아",
          joinedAt: "2023.11.30",
          attendanceRate: 76,
          role: "Member",
          status: "활동 중",
          avatarUrl:
            "https://lh3.googleusercontent.com/aida-public/AB6AXuDXaTgk_WgEldcgI_ngd0yKnRW0mWo0SullXnLA3n6SYS2NrByB87ebVc-csML1a8jFGo6t_cpOh8bh79ywXCLOj2MHv9apVGILbq0Osd3ZK7F3E59M-3_Snjmx3bkYMgRWNMDQSdxECI2VLZcE3_jYv6P3nJgwJGqCv1YAvOdPXpAExJ3BSNLiUHNBd8b35YD-QKMUFCoOMo8LIKGJInb5xkXxA3ezeAaYUqcK7zEZbt982NV19ITd9HvRiToug550tBxKmebNFv2e",
        },
      ]}
    />
  );
}
