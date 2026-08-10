import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";

type ClubId = string | number;

export type TodoAssignee = {
  clubProfileId: number;
  displayName: string | null;
};

export type TodoSummary = {
  todoItemId: number;
  title: string;
  description: string | null;
  todoType: "VOLUNTEER" | "OPERATIONS" | string;
  todoTypeLabel: string;
  assignmentMode: "DIRECT_ASSIGN" | "OPEN_SUPPORT" | string;
  assignmentModeLabel: string;
  statusCode: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELED" | string;
  statusLabel: string;
  priorityCode: "LOW" | "NORMAL" | "HIGH" | "URGENT" | string;
  priorityLabel: string;
  dueAt: string | null;
  dueAtLabel: string | null;
  workStartAt: string | null;
  workEndAt: string | null;
  workTimeLabel: string | null;
  overdue: boolean;
  assignedClubProfileId: number | null;
  assignedDisplayName: string | null;
  assignees: TodoAssignee[];
  assigneeCount: number;
  recruitmentCapacity: number;
  recruitmentFull: boolean;
  linkedScheduleEventId: number | null;
  linkedScheduleTitle: string | null;
  createdByDisplayName: string | null;
  completedByDisplayName: string | null;
  completedAt: string | null;
  completedAtLabel: string | null;
  canClaim: boolean;
  canApply: boolean;
  canCancelApplication: boolean;
  canComplete: boolean;
  canEdit: boolean;
  canManageStatus: boolean;
  canReviewApplications: boolean;
  myApplicationId: number | null;
  myApplicationStatus: "APPLIED" | "SELECTED" | "REJECTED" | "WITHDRAWN" | null;
  myApplicationStatusLabel: string | null;
  applicationCount: number;
};

export type TodoMemberOption = {
  clubProfileId: number;
  memberDisplayName: string;
  memberRoleCode: string;
};

export type ClubTodoResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  myOpenCount: number;
  myCompletedCount: number;
  myApplyingCount: number;
  claimableOpenCount: number;
  overdueCount: number;
  hasMoreClaimable: boolean;
  myTodos: TodoSummary[];
  claimableTodos: TodoSummary[];
  recentCompletedTodos: TodoSummary[];
};

export type ClubAdminTodoResponse = {
  clubId: number;
  clubName: string;
  admin: boolean;
  canCreate: boolean;
  canAssign: boolean;
  canManageStatus: boolean;
  canDelete: boolean;
  activeMemberCount: number;
  openCount: number;
  inProgressCount: number;
  completedCount: number;
  pendingApplicationCount: number;
  overdueCount: number;
  availableMembers: TodoMemberOption[];
  scheduleOptions: TodoScheduleOption[];
  items: TodoSummary[];
  nextCursorTodoItemId: number | null;
  hasNext: boolean;
};

export type CreateClubTodoRequest = {
  title: string;
  description?: string | null;
  todoType: "VOLUNTEER" | "OPERATIONS" | string;
  assignmentMode: "DIRECT_ASSIGN" | "OPEN_SUPPORT" | string;
  assignedClubProfileId?: number | null;
  assignedClubProfileIds?: number[] | null;
  priorityCode?: "LOW" | "NORMAL" | "HIGH" | "URGENT" | string;
  recruitmentCapacity?: number | null;
  dueAt?: string | null;
  workStartAt?: string | null;
  workEndAt?: string | null;
  linkedScheduleEventId?: number | null;
};

export type UpdateClubTodoRequest = CreateClubTodoRequest;

export type UpdateTodoStatusRequest = {
  statusCode: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELED" | "REOPEN" | string;
};

export type CreateTodoApplicationRequest = {
  applicationNote?: string | null;
};

export type ReviewTodoApplicationRequest = {
  applicationStatus: "SELECTED" | "REJECTED" | string;
  reviewNote?: string | null;
};

export type TodoItemApplicationSummary = {
  todoItemApplicationId: number;
  todoItemId: number;
  clubProfileId: number;
  applicantDisplayName: string | null;
  applicationStatus: "APPLIED" | "SELECTED" | "REJECTED" | "WITHDRAWN" | string;
  applicationStatusLabel: string;
  applicationNote: string | null;
  reviewNote: string | null;
  appliedAtLabel: string | null;
  reviewedAtLabel: string | null;
  mine: boolean;
  canReview: boolean;
};

export type TodoItemApplicationsResponse = {
  todoItemId: number;
  title: string;
  assignmentMode: "DIRECT_ASSIGN" | "OPEN_SUPPORT" | string;
  assignmentModeLabel: string;
  statusCode: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELED" | string;
  statusLabel: string;
  assignedClubProfileId: number | null;
  assignedDisplayName: string | null;
  assignees: TodoAssignee[];
  recruitmentCapacity: number;
  applicationCount: number;
  pendingApplicationCount: number;
  canReview: boolean;
  applications: TodoItemApplicationSummary[];
};

export type TodoScheduleOption = {
  eventId: number;
  title: string;
  startAt: string;
  startAtLabel: string;
};

export type TodoChecklistItem = {
  todoChecklistItemId: number;
  content: string;
  sortOrder: number;
  completed: boolean;
  completedByClubProfileId: number | null;
  completedByDisplayName: string | null;
  completedAt: string | null;
};

export type TodoComment = {
  todoCommentId: number;
  authorClubProfileId: number;
  authorDisplayName: string | null;
  content: string;
  createdAt: string;
  mine: boolean;
  canDelete: boolean;
};

export type TodoCollaborationResponse = {
  todoItemId: number;
  title: string;
  canManageChecklist: boolean;
  canComment: boolean;
  completedChecklistCount: number;
  totalChecklistCount: number;
  checklistItems: TodoChecklistItem[];
  comments: TodoComment[];
};

export type TodoActionResponse = {
  todoItemId: number;
  statusCode: string;
  statusLabel: string;
  assignedClubProfileId: number | null;
  assignedDisplayName: string | null;
  completedByClubProfileId: number | null;
  completedByDisplayName: string | null;
  completedAt: string | null;
  completedAtLabel: string | null;
};

export function getClubTodos(clubId: ClubId, claimableSize?: number) {
  const query = claimableSize == null ? "" : `?claimableSize=${claimableSize}`;
  return getJson<ClubTodoResponse>(`/api/semo/v1/clubs/${clubId}/more/todos${query}`);
}

export function applyClubTodo(
  clubId: ClubId,
  todoItemId: string | number,
  request: CreateTodoApplicationRequest = {},
) {
  return postJson<TodoItemApplicationSummary>(`/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/apply`, request);
}

export function cancelMyClubTodoApplication(clubId: ClubId, todoItemId: string | number) {
  return deleteJson<TodoItemApplicationSummary>(`/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/applications/me`);
}

export function completeClubTodo(clubId: ClubId, todoItemId: string | number) {
  return postJson<TodoActionResponse>(`/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/complete`, undefined);
}

export function getTodoCollaboration(clubId: ClubId, todoItemId: string | number) {
  return getJson<TodoCollaborationResponse>(
    `/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/collaboration`,
  );
}

export function addTodoChecklistItem(clubId: ClubId, todoItemId: string | number, content: string) {
  return postJson<TodoChecklistItem>(
    `/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/checklist`,
    { content },
  );
}

export function updateTodoChecklistItem(
  clubId: ClubId,
  todoItemId: string | number,
  todoChecklistItemId: string | number,
  request: { content: string; completed: boolean },
) {
  return putJson<TodoChecklistItem>(
    `/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/checklist/${todoChecklistItemId}`,
    request,
  );
}

export function deleteTodoChecklistItem(
  clubId: ClubId,
  todoItemId: string | number,
  todoChecklistItemId: string | number,
) {
  return deleteJson<void>(
    `/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/checklist/${todoChecklistItemId}`,
  );
}

export function addTodoComment(clubId: ClubId, todoItemId: string | number, content: string) {
  return postJson<TodoComment>(
    `/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/comments`,
    { content },
  );
}

export function deleteTodoComment(
  clubId: ClubId,
  todoItemId: string | number,
  todoCommentId: string | number,
) {
  return deleteJson<void>(
    `/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/comments/${todoCommentId}`,
  );
}

export function getClubAdminTodos(
  clubId: ClubId,
  options: {
    statusFilter?: "ALL" | "OPEN" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | string;
    assignmentFilter?: "ALL" | "ASSIGNED" | "UNASSIGNED" | "OPEN_SUPPORT" | "DIRECT_ASSIGN" | string;
    applicationFilter?: "ALL" | "APPLIED" | "SELECTED" | "REJECTED" | "WITHDRAWN" | string;
    cursorTodoItemId?: number | null;
    size?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (options.statusFilter) {
    params.set("statusFilter", options.statusFilter);
  }
  if (options.assignmentFilter) {
    params.set("assignmentFilter", options.assignmentFilter);
  }
  if (options.applicationFilter) {
    params.set("applicationFilter", options.applicationFilter);
  }
  if (options.cursorTodoItemId != null) {
    params.set("cursorTodoItemId", String(options.cursorTodoItemId));
  }
  if (options.size != null) {
    params.set("size", String(options.size));
  }
  const queryString = params.toString();
  return getJson<ClubAdminTodoResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/todos${queryString ? `?${queryString}` : ""}`);
}

export function getClubAdminTodoApplications(clubId: ClubId, todoItemId: string | number) {
  return getJson<TodoItemApplicationsResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/todos/${todoItemId}/applications`);
}

export function reviewClubTodoApplication(
  clubId: ClubId,
  todoItemId: string | number,
  todoItemApplicationId: string | number,
  request: ReviewTodoApplicationRequest,
) {
  return putJson<TodoItemApplicationSummary>(
    `/api/semo/v1/clubs/${clubId}/admin/more/todos/${todoItemId}/applications/${todoItemApplicationId}/review`,
    request,
  );
}

export function createClubTodo(clubId: ClubId, request: CreateClubTodoRequest) {
  return postJson<TodoSummary>(`/api/semo/v1/clubs/${clubId}/admin/more/todos`, request);
}

export function updateClubTodo(clubId: ClubId, todoItemId: string | number, request: UpdateClubTodoRequest) {
  return putJson<TodoSummary>(`/api/semo/v1/clubs/${clubId}/admin/more/todos/${todoItemId}`, request);
}

export function updateClubTodoStatus(clubId: ClubId, todoItemId: string | number, request: UpdateTodoStatusRequest) {
  return putJson<TodoActionResponse>(`/api/semo/v1/clubs/${clubId}/admin/more/todos/${todoItemId}/status`, request);
}

export function deleteClubTodo(clubId: ClubId, todoItemId: string | number) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/admin/more/todos/${todoItemId}`);
}
