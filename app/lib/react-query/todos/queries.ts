import { queryOptions } from "@tanstack/react-query";
import { getClubAdminTodoApplications, getClubAdminTodos, getClubTodos } from "@/app/lib/clubs";
import { requireApiData } from "@/app/lib/queryUtils";

export const todoQueryKeys = {
  todos: (clubId: string) => ["semo", "clubs", clubId, "todos"] as const,
  adminTodos: (
    clubId: string,
    options: {
      statusFilter?: string;
      assignmentFilter?: string;
      applicationFilter?: string;
      cursorTodoItemId?: number | null;
      size?: number;
    } = {},
  ) => ["semo", "clubs", clubId, "admin-todos", options] as const,
  adminTodoApplications: (clubId: string, todoItemId: number) =>
    ["semo", "clubs", clubId, "admin-todo-applications", todoItemId] as const,
};

export function todoQueryOptions(clubId: string) {
  return queryOptions({
    queryKey: todoQueryKeys.todos(clubId),
    queryFn: async () =>
      requireApiData(await getClubTodos(clubId), "할 일 정보를 다시 불러오지 못했습니다."),
  });
}

export function adminTodosQueryOptions(
  clubId: string,
  options: {
    statusFilter?: string;
    assignmentFilter?: string;
    applicationFilter?: string;
    cursorTodoItemId?: number | null;
    size?: number;
  } = {},
) {
  return queryOptions({
    queryKey: todoQueryKeys.adminTodos(clubId, options),
    queryFn: async () =>
      requireApiData(
        await getClubAdminTodos(clubId, options),
        options.cursorTodoItemId == null
          ? "할 일 운영 정보를 다시 불러오지 못했습니다."
          : "목록을 더 불러오지 못했습니다.",
      ),
  });
}

export function adminTodoApplicationsQueryOptions(clubId: string, todoItemId: number) {
  return queryOptions({
    queryKey: todoQueryKeys.adminTodoApplications(clubId, todoItemId),
    queryFn: async () =>
      requireApiData(
        await getClubAdminTodoApplications(clubId, todoItemId),
        "지원 목록을 불러오지 못했습니다.",
      ),
  });
}
