export const homeQueryKeys = {
  myClubs: ["myClubs"] as const,
  discoverRoot: ["discoverClubs"] as const,
  discover: (query: string) => ["discoverClubs", query] as const,
};

export const clubKeys = {
  detail: (clubId: string) => ["clubs", clubId] as const,
  features: (clubId: string) => ["clubFeatures", clubId] as const,
  profile: (clubId: string) => ["clubProfile", clubId] as const,

  dashboard: {
    widgetEditor: (clubId: string) => ["clubDashboardWidgetEditor", clubId] as const,
    widgets: (clubId: string) => ["clubDashboardWidgets", clubId] as const,
  },

  schedule: {
    monthly: (clubId: string, year: number, month: number) =>
      ["clubSchedule", clubId, year, month] as const,
    home: (clubId: string) => ["clubScheduleHome", clubId] as const,
    eventDetail: (clubId: string, eventId: string) =>
      ["clubScheduleEventDetail", clubId, eventId] as const,
    voteDetail: (clubId: string, voteId: string) =>
      ["clubScheduleVoteDetail", clubId, voteId] as const,
  },

  notice: {
    home: (clubId: string) => ["clubNoticeHome", clubId] as const,
    detail: (clubId: string, noticeId: string) =>
      ["clubNoticeDetail", clubId, noticeId] as const,
    feed: (clubId: string, pinnedOnly?: boolean) =>
      pinnedOnly !== undefined
        ? (["clubBoardFeed", clubId, pinnedOnly] as const)
        : (["clubBoardFeed", clubId] as const),
  },

  board: (clubId: string) => ["clubBoard", clubId] as const,

  poll: {
    home: (clubId: string) => ["clubPollHome", clubId] as const,
  },

  finance: {
    home: (clubId: string) => ["clubFinance", clubId] as const,
    requests: (clubId: string) => ["clubFinanceRequests", clubId] as const,
  },

  todo: {
    list: (clubId: string) => ["clubTodos", clubId] as const,
  },

  feedback: {
    list: (clubId: string) => ["clubFeedback", clubId] as const,
    detail: (clubId: string, feedbackId: string) =>
      ["clubFeedbackDetail", clubId, feedbackId] as const,
  },

  attendance: (clubId: string) => ["clubAttendance", clubId] as const,

  memberDirectory: (clubId: string) => ["clubMemberDirectory", clubId] as const,

  timeline: (clubId: string) => ["clubTimeline", clubId] as const,
  timelineInfinite: (clubId: string) => ["clubTimelineInfinite", clubId] as const,

  tournament: {
    home: (clubId: string, mode: string) =>
      ["clubTournamentHome", clubId, mode] as const,
    detail: (clubId: string, tournamentRecordId: string) =>
      ["clubTournamentDetail", clubId, tournamentRecordId] as const,
  },

  bracket: {
    home: (clubId: string, mode: string) =>
      ["clubBracketHome", clubId, mode] as const,
    detail: (clubId: string, bracketRecordId: string) =>
      ["clubBracketDetail", clubId, bracketRecordId] as const,
  },
};

export const adminKeys = {
  members: (clubId: string) => ["clubAdminMembers", clubId] as const,
  joinRequests: (clubId: string) => ["clubAdminJoinRequests", clubId] as const,
  activities: (clubId: string, scope?: string) =>
    scope
      ? (["clubAdminActivities", clubId, scope] as const)
      : (["clubAdminActivities", clubId] as const),
  activitiesInfinite: (clubId: string) =>
    ["clubAdminActivitiesInfinite", clubId] as const,
  timeline: (clubId: string) => ["clubAdminTimeline", clubId] as const,
  attendance: (clubId: string) => ["clubAdminAttendance", clubId] as const,
  memberDirectory: (clubId: string) =>
    ["clubAdminMemberDirectory", clubId] as const,

  todo: {
    root: (clubId: string) => ["clubAdminTodos", clubId] as const,
    list: (
      clubId: string,
      statusFilter = "ALL",
      assignmentFilter = "ALL",
      applicationFilter = "ALL",
    ) => [
      "clubAdminTodos",
      clubId,
      statusFilter,
      assignmentFilter,
      applicationFilter,
    ] as const,
  },

  roles: {
    list: (clubId: string) => ["clubAdminRoles", clubId] as const,
    detail: (clubId: string, positionId: string) =>
      ["clubAdminRoleDetail", clubId, positionId] as const,
    management: (clubId: string) =>
      ["clubAdminRoleManagement", clubId] as const,
  },

  feedback: {
    list: (clubId: string) => ["clubAdminFeedback", clubId] as const,
    detail: (clubId: string, feedbackId: string) =>
      ["clubAdminFeedbackDetail", clubId, feedbackId] as const,
  },

  finance: {
    home: (clubId: string) => ["clubAdminFinance", clubId] as const,
    obligations: (clubId: string) =>
      ["clubAdminFinanceObligations", clubId] as const,
    requests: (clubId: string) =>
      ["clubAdminFinanceRequests", clubId] as const,
    expenses: (clubId: string) =>
      ["clubAdminFinanceExpenses", clubId] as const,
  },
};
