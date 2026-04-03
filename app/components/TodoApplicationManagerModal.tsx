"use client";

import { RouteModal } from "@/app/components/RouteModal";
import type { TodoItemApplicationSummary, TodoItemApplicationsResponse } from "@/app/lib/clubs";

type TodoApplicationManagerModalProps = {
  data: TodoItemApplicationsResponse | null;
  loading: boolean;
  reviewingApplicationId: number | null;
  onDismiss: () => void;
  onReview: (
    application: TodoItemApplicationSummary,
    applicationStatus: "SELECTED" | "REJECTED",
  ) => Promise<void>;
};

export function TodoApplicationManagerModal({
  data,
  loading,
  reviewingApplicationId,
  onDismiss,
  onReview,
}: TodoApplicationManagerModalProps) {
  return (
    <RouteModal onDismiss={onDismiss} dismissOnBackdrop={false}>
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Applications</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">
              {data ? `${data.title} 신청 관리` : "업무 신청 관리"}
            </h3>
          </div>
          <button
            type="button"
            aria-label="신청 관리 닫기"
            onClick={onDismiss}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              신청 목록을 불러오는 중입니다.
            </div>
          ) : !data ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              신청 정보를 불러오지 못했습니다.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
                    총 신청 {data.applicationCount}건
                  </span>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    대기 {data.pendingApplicationCount}건
                  </span>
                </div>
                <p className="mt-3">
                  현재 상태: {data.statusLabel} / {data.assignmentModeLabel}
                </p>
              </div>

              {data.applications.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  아직 접수된 신청이 없습니다.
                </div>
              ) : (
                data.applications.map((application) => {
                  const isBusy = reviewingApplicationId === application.todoItemApplicationId;

                  return (
                    <article
                      key={application.todoItemApplicationId}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {application.applicantDisplayName ?? "이름 없음"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{application.appliedAtLabel ?? "신청 시각 없음"}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          application.applicationStatus === "SELECTED"
                            ? "bg-emerald-50 text-emerald-700"
                            : application.applicationStatus === "REJECTED"
                              ? "bg-rose-50 text-rose-700"
                              : application.applicationStatus === "WITHDRAWN"
                                ? "bg-slate-100 text-slate-500"
                                : "bg-amber-50 text-amber-700"
                        }`}>
                          {application.applicationStatusLabel}
                        </span>
                      </div>

                      {application.applicationNote ? (
                        <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                          {application.applicationNote}
                        </p>
                      ) : null}

                      {application.reviewNote ? (
                        <p className="mt-3 text-xs text-slate-500">
                          검토 메모: {application.reviewNote}
                        </p>
                      ) : null}

                      {application.canReview ? (
                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => void onReview(application, "SELECTED")}
                            disabled={isBusy}
                            className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                          >
                            {isBusy ? "처리 중..." : "선정"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void onReview(application, "REJECTED")}
                            disabled={isBusy}
                            className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                          >
                            {isBusy ? "처리 중..." : "반려"}
                          </button>
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>
    </RouteModal>
  );
}
