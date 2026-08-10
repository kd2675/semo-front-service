"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useAppToast } from "@/app/hooks/useAppToast";
import {
  addTodoChecklistMutationOptions,
  addTodoCommentMutationOptions,
  deleteTodoChecklistMutationOptions,
  deleteTodoCommentMutationOptions,
  updateTodoChecklistMutationOptions,
} from "@/app/lib/react-query/todos/mutations";
import { todoCollaborationQueryOptions, todoQueryKeys } from "@/app/lib/react-query/todos/queries";

import { ResourceAttachmentPanel } from "./ResourceAttachmentPanel";

type TodoCollaborationPanelProps = {
  clubId: string;
  todoItemId: number;
  terminal?: boolean;
  theme?: "user" | "admin";
};

export function TodoCollaborationPanel({
  clubId,
  todoItemId,
  terminal = false,
  theme = "user",
}: TodoCollaborationPanelProps) {
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();
  const [open, setOpen] = useState(false);
  const [newChecklistContent, setNewChecklistContent] = useState("");
  const [newCommentContent, setNewCommentContent] = useState("");
  const collaborationQuery = useQuery({
    ...todoCollaborationQueryOptions(clubId, todoItemId),
    enabled: open,
  });
  const addChecklistMutation = useMutation(addTodoChecklistMutationOptions(clubId, todoItemId));
  const updateChecklistMutation = useMutation(updateTodoChecklistMutationOptions(clubId, todoItemId));
  const deleteChecklistMutation = useMutation(deleteTodoChecklistMutationOptions(clubId, todoItemId));
  const addCommentMutation = useMutation(addTodoCommentMutationOptions(clubId, todoItemId));
  const deleteCommentMutation = useMutation(deleteTodoCommentMutationOptions(clubId, todoItemId));
  const pending = addChecklistMutation.isPending
    || updateChecklistMutation.isPending
    || deleteChecklistMutation.isPending
    || addCommentMutation.isPending
    || deleteCommentMutation.isPending;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: todoQueryKeys.collaboration(clubId, todoItemId) });
  };

  const handleResult = async (
    result: { ok: boolean; message?: string },
    successMessage: string,
  ) => {
    if (!result.ok) {
      showToast(result.message ?? "요청을 처리하지 못했습니다.", "error");
      return false;
    }
    await refresh();
    showToast(successMessage, "success");
    return true;
  };

  const addChecklist = async () => {
    const content = newChecklistContent.trim();
    if (!content) {
      showToast("체크리스트 내용을 입력해주세요.", "error");
      return;
    }
    const result = await addChecklistMutation.mutateAsync(content);
    if (await handleResult(result, "체크리스트를 추가했습니다.")) {
      setNewChecklistContent("");
    }
  };

  const addComment = async () => {
    const content = newCommentContent.trim();
    if (!content) {
      showToast("댓글 내용을 입력해주세요.", "error");
      return;
    }
    const result = await addCommentMutation.mutateAsync(content);
    if (await handleResult(result, "댓글을 등록했습니다.")) {
      setNewCommentContent("");
    }
  };

  const collaboration = collaborationQuery.data ?? null;
  const progress = collaboration && collaboration.totalChecklistCount > 0
    ? Math.round((collaboration.completedChecklistCount / collaboration.totalChecklistCount) * 100)
    : 0;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between rounded-xl bg-slate-50 px-3.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
      >
        <span className="inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">fact_check</span>
          체크리스트 · 댓글 · 첨부
        </span>
        <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open ? (
        <div className="mt-3 space-y-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          {collaborationQuery.isPending ? (
            <div className="space-y-2" aria-label="업무 협업 정보 불러오는 중">
              <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="h-11 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : collaborationQuery.isError || !collaboration ? (
            <div className="rounded-xl bg-white px-4 py-5 text-center">
              <p className="text-sm font-bold text-slate-700">협업 정보를 불러오지 못했습니다.</p>
              <button
                type="button"
                onClick={() => void collaborationQuery.refetch()}
                className="mt-3 min-h-11 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              <section>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">체크리스트</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {collaboration.completedChecklistCount}/{collaboration.totalChecklistCount} 완료
                    </p>
                  </div>
                  {collaboration.totalChecklistCount > 0 ? (
                    <span className="text-xs font-black text-indigo-600">{progress}%</span>
                  ) : null}
                </div>
                {collaboration.totalChecklistCount > 0 ? (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-indigo-500 transition-[width]" style={{ width: `${progress}%` }} />
                  </div>
                ) : null}
                <div className="mt-3 space-y-2">
                  {collaboration.checklistItems.length > 0 ? collaboration.checklistItems.map((item) => (
                    <div key={item.todoChecklistItemId} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-2.5 py-2">
                      <button
                        type="button"
                        disabled={!collaboration.canManageChecklist || terminal || pending}
                        onClick={async () => {
                          const result = await updateChecklistMutation.mutateAsync({
                            checklistItemId: item.todoChecklistItemId,
                            content: item.content,
                            completed: !item.completed,
                          });
                          await handleResult(result, item.completed ? "체크를 해제했습니다." : "항목을 완료했습니다.");
                        }}
                        aria-label={`${item.content} ${item.completed ? "완료 해제" : "완료 처리"}`}
                        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${item.completed ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"}`}
                      >
                        <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
                          {item.completed ? "check" : "radio_button_unchecked"}
                        </span>
                      </button>
                      <p className={`min-w-0 flex-1 text-sm leading-5 ${item.completed ? "text-slate-400 line-through" : "font-semibold text-slate-700"}`}>
                        {item.content}
                      </p>
                      {collaboration.canManageChecklist && !terminal ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={async () => {
                            if (!window.confirm(`체크리스트 항목을 삭제할까요?\n\n${item.content}`)) return;
                            const result = await deleteChecklistMutation.mutateAsync(item.todoChecklistItemId);
                            await handleResult(result, "체크리스트 항목을 삭제했습니다.");
                          }}
                          aria-label={`${item.content} 삭제`}
                          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                        </button>
                      ) : null}
                    </div>
                  )) : (
                    <p className="rounded-xl bg-white px-4 py-4 text-center text-xs text-slate-400">아직 체크리스트가 없습니다.</p>
                  )}
                </div>
                {collaboration.canManageChecklist && !terminal ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newChecklistContent}
                      onChange={(event) => setNewChecklistContent(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                          event.preventDefault();
                          void addChecklist();
                        }
                      }}
                      maxLength={300}
                      placeholder="새 체크리스트 항목"
                      aria-label="새 체크리스트 항목"
                      className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={() => void addChecklist()}
                      disabled={pending || !newChecklistContent.trim()}
                      className="min-h-11 shrink-0 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      추가
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="border-t border-slate-200 pt-5">
                <h4 className="text-sm font-black text-slate-800">댓글</h4>
                <div className="mt-3 space-y-2">
                  {collaboration.comments.length > 0 ? collaboration.comments.map((comment) => (
                    <div key={comment.todoCommentId} className="rounded-xl bg-white px-3 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-500">{comment.authorDisplayName ?? "멤버"}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.content}</p>
                        </div>
                        {comment.canDelete ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={async () => {
                              if (!window.confirm("이 댓글을 삭제할까요?")) return;
                              const result = await deleteCommentMutation.mutateAsync(comment.todoCommentId);
                              await handleResult(result, "댓글을 삭제했습니다.");
                            }}
                            aria-label={`${comment.authorDisplayName ?? "멤버"} 댓글 삭제`}
                            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )) : (
                    <p className="rounded-xl bg-white px-4 py-4 text-center text-xs text-slate-400">아직 댓글이 없습니다.</p>
                  )}
                </div>
                {collaboration.canComment ? (
                  <div className="mt-3">
                    <textarea
                      value={newCommentContent}
                      onChange={(event) => setNewCommentContent(event.target.value)}
                      rows={3}
                      maxLength={2000}
                      placeholder="진행 상황이나 필요한 내용을 공유하세요."
                      aria-label="업무 댓글"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm leading-6 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={() => void addComment()}
                      disabled={pending || !newCommentContent.trim()}
                      className="mt-2 min-h-11 w-full rounded-xl bg-slate-900 px-4 text-xs font-bold text-white disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      댓글 등록
                    </button>
                  </div>
                ) : null}
              </section>

              <section className="border-t border-slate-200 pt-5">
                <ResourceAttachmentPanel
                  clubId={clubId}
                  resourceType="TODO_ITEM"
                  resourceId={todoItemId}
                  canUpload={collaboration.canManageChecklist}
                  canDelete={collaboration.canManageChecklist}
                  theme={theme}
                />
              </section>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
