import { mutationOptions } from "@tanstack/react-query";
import {
  applyClubTodo,
  cancelMyClubTodoApplication,
  completeClubTodo,
  createClubTodo,
  deleteClubTodo,
  reviewClubTodoApplication,
  updateClubTodo,
  updateClubTodoStatus,
} from "@/app/lib/clubs";

export function applyTodoMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (todoItemId: number) => applyClubTodo(clubId, todoItemId),
  });
}

export function cancelTodoMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (todoItemId: number) => cancelMyClubTodoApplication(clubId, todoItemId),
  });
}

export function completeTodoMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (todoItemId: number) => completeClubTodo(clubId, todoItemId),
  });
}

export function saveTodoMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({
      request,
      todoItemId,
    }: {
      request: Parameters<typeof createClubTodo>[1];
      todoItemId?: number;
    }) =>
      todoItemId != null
        ? updateClubTodo(clubId, todoItemId, request)
        : createClubTodo(clubId, request),
  });
}

export function updateTodoStatusMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({
      todoItemId,
      statusCode,
    }: {
      todoItemId: number;
      statusCode: Parameters<typeof updateClubTodoStatus>[2]["statusCode"];
    }) =>
      updateClubTodoStatus(clubId, todoItemId, { statusCode }),
  });
}

export function reviewTodoApplicationMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: ({
      todoItemId,
      todoItemApplicationId,
      applicationStatus,
    }: {
      todoItemId: number;
      todoItemApplicationId: number;
      applicationStatus: Parameters<typeof reviewClubTodoApplication>[3]["applicationStatus"];
    }) =>
      reviewClubTodoApplication(clubId, todoItemId, todoItemApplicationId, { applicationStatus }),
  });
}

export function deleteTodoMutationOptions(clubId: string) {
  return mutationOptions({
    mutationFn: (todoItemId: number) => deleteClubTodo(clubId, todoItemId),
  });
}
