import { deleteJson, getJson, postJson, putJson } from "@/app/lib/api";

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
  dueAt: string | null;
  dueAtLabel: string | null;
  overdue: boolean;
  assignedClubProfileId: number | null;
  assignedDisplayName: string | null;
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
  dueAt?: string | null;
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
  applicationCount: number;
  pendingApplicationCount: number;
  canReview: boolean;
  applications: TodoItemApplicationSummary[];
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

export function getClubTodos(clubId: string | number) {
  return getJson<ClubTodoResponse>(`/api/semo/v1/clubs/${clubId}/more/todos`);
}

export function applyClubTodo(
  clubId: string | number,
  todoItemId: string | number,
  request: CreateTodoApplicationRequest = {},
) {
  return postJson<TodoItemApplicationSummary>(
    `/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/apply`,
    request,
  );
}

export function claimClubTodo(clubId: string | number, todoItemId: string | number) {
  return postJson<TodoActionResponse>(`/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/claim`, undefined);
}

export function cancelMyClubTodoApplication(clubId: string | number, todoItemId: string | number) {
  return deleteJson<TodoItemApplicationSummary>(
    `/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/applications/me`,
  );
}

export function completeClubTodo(clubId: string | number, todoItemId: string | number) {
  return postJson<TodoActionResponse>(`/api/semo/v1/clubs/${clubId}/more/todos/${todoItemId}/complete`, undefined);
}

export function getClubAdminTodos(
  clubId: string | number,
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
  return getJson<ClubAdminTodoResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/todos${queryString ? `?${queryString}` : ""}`,
  );
}

export function getClubAdminTodoApplications(clubId: string | number, todoItemId: string | number) {
  return getJson<TodoItemApplicationsResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/todos/${todoItemId}/applications`,
  );
}

export function reviewClubTodoApplication(
  clubId: string | number,
  todoItemId: string | number,
  todoItemApplicationId: string | number,
  request: ReviewTodoApplicationRequest,
) {
  return putJson<TodoItemApplicationSummary>(
    `/api/semo/v1/clubs/${clubId}/admin/more/todos/${todoItemId}/applications/${todoItemApplicationId}/review`,
    request,
  );
}

export function createClubTodo(
  clubId: string | number,
  request: CreateClubTodoRequest,
) {
  return postJson<TodoSummary>(`/api/semo/v1/clubs/${clubId}/admin/more/todos`, request);
}

export function updateClubTodo(
  clubId: string | number,
  todoItemId: string | number,
  request: UpdateClubTodoRequest,
) {
  return putJson<TodoSummary>(`/api/semo/v1/clubs/${clubId}/admin/more/todos/${todoItemId}`, request);
}

export function updateClubTodoStatus(
  clubId: string | number,
  todoItemId: string | number,
  request: UpdateTodoStatusRequest,
) {
  return putJson<TodoActionResponse>(
    `/api/semo/v1/clubs/${clubId}/admin/more/todos/${todoItemId}/status`,
    request,
  );
}

export function deleteClubTodo(
  clubId: string | number,
  todoItemId: string | number,
) {
  return deleteJson<void>(`/api/semo/v1/clubs/${clubId}/admin/more/todos/${todoItemId}`);
}
