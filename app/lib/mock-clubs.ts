export type ClubSummary = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  imageUrl: string;
};

export type RecommendationItem = {
  id: string;
  name: string;
  description: string;
  members: string;
  imageUrl: string;
};

export type ClubDashboard = {
  id: string;
  name: string;
  shortCode: string;
  isAdmin: boolean;
  coverImageUrl: string;
  nextMatchImageUrl: string;
  nextMatch: {
    opponent: string;
    dateLabel: string;
    location: string;
  };
  recentActivities: Array<{
    id: string;
    title: string;
    subtitle: string;
    tone: "primary" | "emerald" | "amber";
  }>;
  topRankings: Array<{
    rank: number;
    name: string;
    points: string;
  }>;
  dues: {
    status: string;
    period: string;
    amount: string;
  };
  attendance: {
    bars: number[];
    rateLabel: string;
  };
};

export type NoticeBoardCategory = "all" | "tournaments" | "matches" | "social";

export type ClubNotice = {
  id: string;
  icon: string;
  title: string;
  summary: string;
  author: string;
  timeAgo: string;
  category: Exclude<NoticeBoardCategory, "all">;
};

export type ClubScheduleEvent = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  startTime: string;
  durationLabel?: string;
  tone: "primary" | "amber" | "slate";
};

export type ClubScheduleMonth = {
  id: string;
  label: string;
  shortLabel: string;
  year: number;
  month: number;
  leadingBlankDays: number;
  daysInMonth: number;
  defaultSelectedDay: number;
  eventsByDay: Record<number, ClubScheduleEvent[]>;
  teaser?: {
    label: string;
    event: ClubScheduleEvent;
  };
};

export type ClubMemberProfileRecord = {
  id: string;
  icon: string;
  accent: "primary" | "blue" | "orange" | "purple";
  title: string;
  value: string;
  trendLabel: string;
  trendTone: "emerald" | "slate";
  trendIcon?: string;
};

export type ClubMemberProfileLink = {
  id: string;
  icon: string;
  accent: "blue" | "emerald" | "slate";
  label: string;
  href: string;
};

export type ClubMemberProfile = {
  clubId: string;
  name: string;
  membershipLabel: string;
  joinedLabel: string;
  avatarImageUrl: string;
  records: ClubMemberProfileRecord[];
  quickLinks: ClubMemberProfileLink[];
};

export const MY_CLUBS: ClubSummary[] = [
  {
    id: "tennis",
    name: "SNU Tennis Club",
    subtitle: "Next match tomorrow, 4PM",
    icon: "calendar_today",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB0KqGzAen4i-aMxyRJc5iXYwWJZFxI45t6knGD5NeZR6HEPlqPGCETI5-4bNNBKAGLtvOMb_ZE8c-FYSEAL9gGTZyyum-xjgdW7ZMNb--13q4UVFn6bZm28SEGcjZut2Jm_PRoBq9N7aDovZYGQC9ahiungw34bY7nqr24gyH3mzfgHO09VuRj4ePBy32WkCH1U8SyxhpuYq4W7s-QMkAh0mZc4lHnYW4mUPZmLqtSq2P_LaB0GkeO_Iq-AnqkUzfF9u-zoxIVd1t-",
  },
  {
    id: "running",
    name: "SNU Running",
    subtitle: "Group run in 2 hours",
    icon: "event",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDNdxcfWVcD_JyRAa3DsPRzRbPGet_lW-Ngkyd7WbixAet1Ty8BWkSlnSSUMRirs_AUIrP7WUP4vcyNuqZxf2dMrunDs-23JCyxHUqeLoI_36ahkJ_kt_jY5LwIisvOhQPIYbRoUsVtA3RcgGBwjMkbNvIjO5sc6GZ0GPvQFf_SK46-fQ5LRwoHuz3MphNO1Fde0w2MIL0hlfPHUajjU0t8Djz0ot9N-nX2gi4lyLZLamCQjBYId1bxuUDrqSlybEQa7GMK6nplysP",
  },
];

export const RECOMMENDED_CLUBS: RecommendationItem[] = [
  {
    id: "jazz",
    name: "Jazz Soul Society",
    description: "Weekly jam sessions and history talks",
    members: "124 members",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA3SBjFLdIyM09dDROve11SdlrcQVR4We4JjbJMP0hS2oYkv9hOItRDmOnjzYqHD3aG_WdPO4b0QLnjbsHnZNEDTsMTsOFvUuaoq01P-D6P_Mmvwkq66RmeRUx6hvfT18GUhXgeWU_R0Z3kRaOlxdBabYiOpYhKuunvvbMpop8pRrG4j4QRTXHAs9uQJaWkatP9PxRYYotWGrwtAydR7JJhv6DJyBhtafyctNj34D-jAIhEC5MH_3QRnCPdY0gO7jRAvovSxvjloiln",
  },
  {
    id: "climbing",
    name: "Urban Climbers",
    description: "Conquer the best walls in the city",
    members: "89 members",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBiu_qspTwTYS5cVKrkEflftxhwAJuMDTLUfVCN26hDKixUobX2ElYX_pozDWbhPLfIRLoVUo8nBlpxAoHnaVNEiRfWwPMQNIujkzbrYiemydId2gEvvumBqLoYBae9XJrJj3tTr1oeP0K5cQF2hIIMbDLScv1YBG7D_ykEJMHvUlYciFzfN7wTddAt3h1GcjckfQIjibn03BkJHrokHhgmZ6opFEmwiAGz73u6jF-rzUyQMHxduUUDw4oE41WtJK3mwZm6Xr-oGvTD",
  },
  {
    id: "stars",
    name: "Star Gazers Hub",
    description: "Rooftop astronomy and night tours",
    members: "210 members",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCY12mqZqPSTyDrsNgro2xr4C-GBBlPQpxZ9TbYcZ2aaXqQQeVYHxj7D07jT4_2F94GXGDEro5TjONIlanyoWI-hgL6VHdPPRH_ae9q7pjjQRAeAN0NE7MrMvArkZ6RAb3hrGEaArvuBtNdl1rZX5Sy0x3zUoIVmwdXd5Y4coaCDI50A5H60vvKDvyeQ-IXef-X0rUughDuPE0vBIhukhubAkScrvGWt6si40C1-W0CwEQqEZkogA63wVldvLhS5pGWYrsqonzKMRVy",
  },
];

export const CLUB_DASHBOARDS: ClubDashboard[] = [
  {
    id: "tennis",
    name: "SNU Tennis Club",
    shortCode: "STC",
    isAdmin: true,
    coverImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB9ecZwcI-ipHMNg0_7eaYxfBT50hVf8bAnypRS3JX7qcrau9365cTGul0Qc3SxqIHPKFPEB-Z8kMcyNW0__rPVKnxfbAcaYiPZW9eLax2k2lgHpWP36o_GfGEERYd4B6a_bBrYGaolMRxpWc12Uru5JOaJqe8mLV6lNwQgiuun9u4yBLLG7RS0zpqfcP3s-3V3O7SRT68IKsXPmFmF-V7wVDMiqY059VU6GtQftCsBcsBl0fVzxi3RoaP1xtNXgvPHRHjC44P-tyl1",
    nextMatchImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDTHzpwuQs4bns3zliFN5_WNuAUdrM8P3-qmZEO6gVFGtmyEZADt02SNrHLSYaN7S_uL1Oq6f7iHnG_V-9jclp5f6UBLiCsX5rdMLc4Fhtphi1fhDK1TcwTnJQp3rFsZkaIdOkeq59VtJptukB9FU-QbWnTMgbH7AFjvSgZtaK2DQDYuvF6EICaaQDasfLWCMSydFzZSqXIKbw_A0NjK_qsdTCd0-MDKDqNhkdeVC6VEA-435KQEphPrfuGJuSc2yCcQQfdPKt1pSiD",
    nextMatch: {
      opponent: "Yonsei University",
      dateLabel: "Oct 24, 2023 • 4:00 PM",
      location: "SNU Main Tennis Courts",
    },
    recentActivities: [
      {
        id: "results",
        title: "Match Results Added",
        subtitle: "2 hours ago • Vs Korea Univ",
        tone: "primary",
      },
      {
        id: "member",
        title: "New Member Joined",
        subtitle: "5 hours ago • Kim Min-su",
        tone: "emerald",
      },
      {
        id: "venue",
        title: "Venue Changed",
        subtitle: "Yesterday • Court 4 Reserved",
        tone: "amber",
      },
    ],
    topRankings: [
      { rank: 1, name: "Lee Jun-ho", points: "2400 pts" },
      { rank: 2, name: "Park Ji-won", points: "2150 pts" },
      { rank: 3, name: "Choi Hana", points: "1980 pts" },
    ],
    dues: {
      status: "Paid",
      period: "Period: Oct 2023",
      amount: "$25.00",
    },
    attendance: {
      bars: [40, 60, 30, 80, 95],
      rateLabel: "85% Rate",
    },
  },
  {
    id: "running",
    name: "SNU Running",
    shortCode: "SNR",
    isAdmin: false,
    coverImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDNdxcfWVcD_JyRAa3DsPRzRbPGet_lW-Ngkyd7WbixAet1Ty8BWkSlnSSUMRirs_AUIrP7WUP4vcyNuqZxf2dMrunDs-23JCyxHUqeLoI_36ahkJ_kt_jY5LwIisvOhQPIYbRoUsVtA3RcgGBwjMkbNvIjO5sc6GZ0GPvQFf_SK46-fQ5LRwoHuz3MphNO1Fde0w2MIL0hlfPHUajjU0t8Djz0ot9N-nX2gi4lyLZLamCQjBYId1bxuUDrqSlybEQa7GMK6nplysP",
    nextMatchImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCDNdxcfWVcD_JyRAa3DsPRzRbPGet_lW-Ngkyd7WbixAet1Ty8BWkSlnSSUMRirs_AUIrP7WUP4vcyNuqZxf2dMrunDs-23JCyxHUqeLoI_36ahkJ_kt_jY5LwIisvOhQPIYbRoUsVtA3RcgGBwjMkbNvIjO5sc6GZ0GPvQFf_SK46-fQ5LRwoHuz3MphNO1Fde0w2MIL0hlfPHUajjU0t8Djz0ot9N-nX2gi4lyLZLamCQjBYId1bxuUDrqSlybEQa7GMK6nplysP",
    nextMatch: {
      opponent: "Hangang Night Run Crew",
      dateLabel: "Oct 25, 2023 • 7:30 PM",
      location: "Olympic Park North Gate",
    },
    recentActivities: [
      {
        id: "route",
        title: "Route Shared",
        subtitle: "1 hour ago • Riverside 10K",
        tone: "primary",
      },
      {
        id: "coach",
        title: "Coach Note Uploaded",
        subtitle: "Today • Interval Training",
        tone: "emerald",
      },
      {
        id: "weather",
        title: "Weather Alert",
        subtitle: "Yesterday • Pace run delayed",
        tone: "amber",
      },
    ],
    topRankings: [
      { rank: 1, name: "Han Seo-jin", points: "1980 pts" },
      { rank: 2, name: "Yoo Min-jae", points: "1870 pts" },
      { rank: 3, name: "Kang So-young", points: "1760 pts" },
    ],
    dues: {
      status: "Paid",
      period: "Period: Oct 2023",
      amount: "$18.00",
    },
    attendance: {
      bars: [55, 75, 45, 88, 92],
      rateLabel: "88% Rate",
    },
  },
];

export const CLUB_NOTICES: Record<string, ClubNotice[]> = {
  tennis: [
    {
      id: "championship-finals",
      icon: "sports_tennis",
      title: "Club Championship Finals 2024",
      summary:
        "The finals will be held this Saturday starting from 10 AM. All members are welcome to watch the matches and join the reception.",
      author: "Club Manager",
      timeAgo: "2h ago",
      category: "tournaments",
    },
    {
      id: "court-maintenance",
      icon: "construction",
      title: "Court Maintenance Schedule",
      summary:
        "Courts 1-4 will be closed for resurfacing from Monday to Wednesday next week. Please book alternate courts in advance.",
      author: "Facilities Team",
      timeAgo: "5h ago",
      category: "matches",
    },
    {
      id: "junior-mixer",
      icon: "groups",
      title: "Junior Mixer Night",
      summary:
        "Calling all junior players! Join us for a fun mixer night with pizza and friendly doubles matches this Friday at 6 PM.",
      author: "Coach Sarah",
      timeAgo: "1d ago",
      category: "social",
    },
    {
      id: "summer-bbq",
      icon: "restaurant",
      title: "Summer BBQ Registration",
      summary:
        "Don't forget to sign up for the Annual Summer BBQ. Early bird registration ends this Sunday. Family tickets available.",
      author: "Social Committee",
      timeAgo: "2d ago",
      category: "social",
    },
  ],
  running: [
    {
      id: "night-run-race",
      icon: "directions_run",
      title: "Night Run League Round 3",
      summary:
        "Round 3 starts Friday at 8 PM. Check your assigned pace groups and submit your checkpoint confirmations after the session.",
      author: "Crew Captain",
      timeAgo: "3h ago",
      category: "tournaments",
    },
    {
      id: "trail-route-change",
      icon: "route",
      title: "Weekend Trail Route Changed",
      summary:
        "Due to weather conditions, this week's hill trail session has moved to the riverside 12K course. Meet at Gate 2.",
      author: "Operations Team",
      timeAgo: "7h ago",
      category: "matches",
    },
    {
      id: "recovery-session",
      icon: "fitness_center",
      title: "Recovery Stretch Session",
      summary:
        "Post-run mobility and foam rolling session starts Thursday at 7 PM. Bring your own mat and resistance band.",
      author: "Coach Min",
      timeAgo: "1d ago",
      category: "matches",
    },
    {
      id: "crew-brunch",
      icon: "coffee",
      title: "Sunday Crew Brunch",
      summary:
        "After the long run, we're gathering for brunch near Olympic Park. RSVP by Saturday noon so we can book enough seats.",
      author: "Community Host",
      timeAgo: "2d ago",
      category: "social",
    },
  ],
};

export const CLUB_SCHEDULES: Record<string, ClubScheduleMonth[]> = {
  tennis: [
    {
      id: "2023-10",
      label: "October 2023",
      shortLabel: "Oct",
      year: 2023,
      month: 10,
      leadingBlankDays: 5,
      daysInMonth: 30,
      defaultSelectedDay: 24,
      eventsByDay: {
        24: [
          {
            id: "weekly-match",
            icon: "sports_tennis",
            title: "Weekly Match",
            subtitle: "Court 1 • Advanced Level",
            startTime: "09:00 AM",
            durationLabel: "60 Min",
            tone: "primary",
          },
          {
            id: "practice-session",
            icon: "exercise",
            title: "Practice Session",
            subtitle: "Court 4 • With Coach Sarah",
            startTime: "04:30 PM",
            durationLabel: "90 Min",
            tone: "amber",
          },
        ],
      },
      teaser: {
        label: "Tomorrow, Oct 25",
        event: {
          id: "club-social-mixer",
          icon: "group",
          title: "Club Social Mixer",
          subtitle: "All Courts • Drinks Included",
          startTime: "06:00 PM",
          tone: "slate",
        },
      },
    },
    {
      id: "2023-11",
      label: "November 2023",
      shortLabel: "Nov",
      year: 2023,
      month: 11,
      leadingBlankDays: 3,
      daysInMonth: 30,
      defaultSelectedDay: 4,
      eventsByDay: {
        4: [
          {
            id: "team-selection",
            icon: "emoji_events",
            title: "Team Selection Match",
            subtitle: "Court 2 • Singles Evaluation",
            startTime: "11:00 AM",
            durationLabel: "75 Min",
            tone: "primary",
          },
        ],
        11: [
          {
            id: "strategy-review",
            icon: "strategy",
            title: "Strategy Review",
            subtitle: "Club Room • Video Session",
            startTime: "05:30 PM",
            durationLabel: "45 Min",
            tone: "slate",
          },
        ],
      },
    },
  ],
  running: [
    {
      id: "2023-10",
      label: "October 2023",
      shortLabel: "Oct",
      year: 2023,
      month: 10,
      leadingBlankDays: 5,
      daysInMonth: 30,
      defaultSelectedDay: 25,
      eventsByDay: {
        25: [
          {
            id: "interval-run",
            icon: "directions_run",
            title: "Interval Run",
            subtitle: "River Loop • Pace Group A",
            startTime: "07:00 PM",
            durationLabel: "70 Min",
            tone: "primary",
          },
          {
            id: "stretch-session",
            icon: "self_improvement",
            title: "Stretch Session",
            subtitle: "Track Field • Recovery Flow",
            startTime: "08:20 PM",
            durationLabel: "30 Min",
            tone: "amber",
          },
        ],
      },
      teaser: {
        label: "Tomorrow, Oct 26",
        event: {
          id: "brunch-meetup",
          icon: "coffee",
          title: "Runner Brunch Meetup",
          subtitle: "Olympic Park • Coffee Included",
          startTime: "10:30 AM",
          tone: "slate",
        },
      },
    },
  ],
};

export const CLUB_MEMBER_PROFILES: Record<string, ClubMemberProfile> = {
  tennis: {
    clubId: "tennis",
    name: "Alex Thompson",
    membershipLabel: "Gold Member",
    joinedLabel: "Joined 2022",
    avatarImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCQezABXc5WFTfLZWVAuowCwunLPP-85LIO-Ygd80mYeJdrNr-hHb-bcMPWHafWzM2GSyPZY9LtS69KC0D3qtYWLlFcK18RCO6GUelo0CtDrNL6v0qvzmzeqVewYHY4seHPbz3LIfyKyigt9ZOda4ybVsppUARrDrBOCjoL6_HDY9ExOtUkEcGrfpiYxjtRMTIWpMcaIhylSmComwHxi0TZfWR3KACgS1HgjwIfU9B7YwHiEhWCKqBu56_dBRU7fHx36aaHDtG08ZOU",
    records: [
      {
        id: "win-rate",
        icon: "emoji_events",
        accent: "primary",
        title: "Win Rate",
        value: "68%",
        trendLabel: "+5.2%",
        trendTone: "emerald",
        trendIcon: "trending_up",
      },
      {
        id: "matches",
        icon: "sports_tennis",
        accent: "blue",
        title: "Matches",
        value: "142",
        trendLabel: "12 New",
        trendTone: "emerald",
        trendIcon: "add",
      },
      {
        id: "club-rank",
        icon: "leaderboard",
        accent: "orange",
        title: "Club Rank",
        value: "#12",
        trendLabel: "2 Spots",
        trendTone: "emerald",
        trendIcon: "expand_less",
      },
      {
        id: "streak",
        icon: "local_fire_department",
        accent: "purple",
        title: "Streak",
        value: "4",
        trendLabel: "Best: 8",
        trendTone: "slate",
      },
    ],
    quickLinks: [
      {
        id: "match-history",
        icon: "history",
        accent: "blue",
        label: "Match History",
        href: "/clubs/tennis/board",
      },
      {
        id: "memberships",
        icon: "payments",
        accent: "emerald",
        label: "Memberships",
        href: "/clubs/tennis",
      },
      {
        id: "support",
        icon: "help",
        accent: "slate",
        label: "Support Center",
        href: "/clubs/tennis/schedule",
      },
    ],
  },
  running: {
    clubId: "running",
    name: "Jamie Park",
    membershipLabel: "Crew Member",
    joinedLabel: "Joined 2023",
    avatarImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDyqm_r99tqyn71EzbnIefLy8LYExgHR2UhPbAOLRrP3V51wh_J_3wItT1ksldMJCTM1gM-DZNNWhSWhPXJEBungd9rMjTNTUAGp4dHOO1U7znNnjdeWCbKKYiocY4PoWaMk8-n_-VtX1HpMGa2XqqN7V1Nk_ZXOCKqe3yyCkaIUWJzK5RyqFQ1XP2GwWpNK2Hmj1fcKQ7gn1JQYH-a7frOzGxw63ot2b3uiMiUavktfkbnKVaZPXDWiV1Uq-S2BYsFdwJ2ZdDNGP18",
    records: [
      {
        id: "win-rate",
        icon: "pace",
        accent: "primary",
        title: "Consistency",
        value: "91%",
        trendLabel: "+3.8%",
        trendTone: "emerald",
        trendIcon: "trending_up",
      },
      {
        id: "matches",
        icon: "directions_run",
        accent: "blue",
        title: "Sessions",
        value: "88",
        trendLabel: "7 New",
        trendTone: "emerald",
        trendIcon: "add",
      },
      {
        id: "club-rank",
        icon: "leaderboard",
        accent: "orange",
        title: "Crew Rank",
        value: "#7",
        trendLabel: "1 Spot",
        trendTone: "emerald",
        trendIcon: "expand_less",
      },
      {
        id: "streak",
        icon: "local_fire_department",
        accent: "purple",
        title: "Streak",
        value: "9",
        trendLabel: "Best: 14",
        trendTone: "slate",
      },
    ],
    quickLinks: [
      {
        id: "run-history",
        icon: "history",
        accent: "blue",
        label: "Run History",
        href: "/clubs/running/board",
      },
      {
        id: "memberships",
        icon: "payments",
        accent: "emerald",
        label: "Memberships",
        href: "/clubs/running",
      },
      {
        id: "support",
        icon: "help",
        accent: "slate",
        label: "Support Center",
        href: "/clubs/running/schedule",
      },
    ],
  },
};

export function getClubDashboard(clubId: string): ClubDashboard | undefined {
  return CLUB_DASHBOARDS.find((club) => club.id === clubId);
}

export function getClubNotices(clubId: string): ClubNotice[] {
  return CLUB_NOTICES[clubId] ?? [];
}

export function getClubScheduleMonths(clubId: string): ClubScheduleMonth[] {
  return CLUB_SCHEDULES[clubId] ?? [];
}

export function getClubMemberProfile(clubId: string): ClubMemberProfile | undefined {
  return CLUB_MEMBER_PROFILES[clubId];
}
