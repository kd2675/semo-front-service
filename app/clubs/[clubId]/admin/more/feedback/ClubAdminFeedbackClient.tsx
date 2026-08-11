"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ResourceAttachmentPanel } from "@/app/components/ResourceAttachmentPanel";
import { useAppToast } from "@/app/hooks/useAppToast";
import {
  type ClubAdminFeedbackResponse,
  type ClubFeedbackDetailResponse,
  type ClubFeedbackStatusCode,
  type ClubFeedbackSummary,
  type ClubFeedbackType,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import { updateFeedbackMutationOptions } from "@/app/lib/react-query/feedback/mutations";
import {
  adminFeedbackDetailQueryOptions,
  adminFeedbackHomeQueryOptions,
  feedbackQueryKeys,
} from "@/app/lib/react-query/feedback/queries";

type ClubAdminFeedbackClientProps = {
  clubId: string;
  initialData: ClubAdminFeedbackResponse;
  initialDetail: ClubFeedbackDetailResponse | null;
};

type StatusFilter = "ALL" | ClubFeedbackStatusCode;

const FEEDBACK_TYPE_OPTIONS: Array<{ value: ClubFeedbackType; label: string }> = [
  { value: "SUGGESTION", label: "건의" },
  { value: "INCONVENIENCE", label: "불편 신고" },
  { value: "IMPROVEMENT_REQUEST", label: "개선 요청" },
];

const STATUS_OPTIONS: Array<{ value: ClubFeedbackStatusCode; label: string }> = [
  { value: "RECEIVED", label: "접수" },
  { value: "IN_REVIEW", label: "검토 중" },
  { value: "ANSWERED", label: "답변 완료" },
  { value: "CLOSED", label: "종료" },
];

const STATUS_FILTER_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  ...STATUS_OPTIONS,
];

function getStatusTone(statusCode: ClubFeedbackStatusCode) {
  switch (statusCode) {
    case "ANSWERED":
      return "bg-emerald-50 text-emerald-700";
    case "IN_REVIEW":
      return "bg-amber-50 text-amber-700";
    case "CLOSED":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-orange-50 text-[#ec5b13]";
  }
}

function getVisibilityTone(visibilityScope: ClubFeedbackSummary["visibilityScope"]) {
  return visibilityScope === "PUBLIC"
    ? "bg-violet-50 text-violet-700"
    : "bg-slate-100 text-slate-600";
}

function matchesAdminFilters(
  item: ClubFeedbackSummary,
  statusFilter: StatusFilter,
) {
  return statusFilter === "ALL" || item.statusCode === statusFilter;
}

export function ClubAdminFeedbackClient({
  clubId,
  initialData,
  initialDetail,
}: ClubAdminFeedbackClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const queryClient = useQueryClient();
  const feedbackHomeQuery = useQuery({
    ...adminFeedbackHomeQueryOptions(clubId),
    initialData,
  });
  const feedbackHome = feedbackHomeQuery.data;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(
    initialDetail?.feedbackId ?? initialData.items[0]?.feedbackId ?? null,
  );
  const [selectedDetail, setSelectedDetail] = useState<ClubFeedbackDetailResponse | null>(
    initialDetail,
  );
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackType, setFeedbackType] = useState<ClubFeedbackType>(
    initialDetail?.feedbackType ?? "SUGGESTION",
  );
  const [statusCode, setStatusCode] = useState<ClubFeedbackStatusCode>(
    initialDetail?.statusCode ?? "RECEIVED",
  );
  const [adminAnswer, setAdminAnswer] = useState(initialDetail?.adminAnswer ?? "");
  const { showToast, clearToast } = useAppToast();
  const updateFeedbackMutation = useMutation(updateFeedbackMutationOptions(clubId, selectedFeedbackId ?? 0));
  const detailRequestSequence = useRef(0);

  const filteredItems = useMemo(
    () =>
      feedbackHome.items.filter((item) =>
        matchesAdminFilters(item, statusFilter),
      ),
    [feedbackHome.items, statusFilter],
  );

  const loadDetail = async (feedbackId: number) => {
    const requestSequence = ++detailRequestSequence.current;
    setSelectedFeedbackId(feedbackId);
    setIsDetailLoading(true);
    try {
      const detail = await queryClient.fetchQuery({
        ...adminFeedbackDetailQueryOptions(clubId, feedbackId),
      });
      if (requestSequence !== detailRequestSequence.current) return;
      setSelectedDetail(detail);
      setFeedbackType(detail.feedbackType);
      setStatusCode(detail.statusCode);
      setAdminAnswer(detail.adminAnswer ?? "");
    } catch {
      if (requestSequence !== detailRequestSequence.current) return;
      showToast("피드백 상세를 불러오지 못했습니다.", "error");
    } finally {
      if (requestSequence === detailRequestSequence.current) {
        setIsDetailLoading(false);
      }
    }
  };

  const refreshAdminHome = async (nextSelectedFeedbackId?: number | null) => {
    const result = await feedbackHomeQuery.refetch();
    if (!result.data) {
      showToast("피드백 관리 목록을 새로고침하지 못했습니다.", "error");
      return;
    }
    const fallbackFeedbackId = result.data.items[0]?.feedbackId ?? null;
    const resolvedFeedbackId = nextSelectedFeedbackId ?? fallbackFeedbackId;
    if (resolvedFeedbackId != null) {
      void loadDetail(resolvedFeedbackId);
      return;
    }
    setSelectedFeedbackId(null);
    setSelectedDetail(null);
  };

  const handleSave = async () => {
    if (selectedFeedbackId == null) {
      return;
    }
    clearToast();
    setIsSaving(true);
    const result = await updateFeedbackMutation.mutateAsync({
      feedbackType,
      statusCode,
      visibilityScope: selectedDetail?.visibilityScope ?? "PRIVATE",
      adminAnswer,
    });
    setIsSaving(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "피드백 저장에 실패했습니다.", "error");
      return;
    }

    queryClient.setQueryData(
      feedbackQueryKeys.adminFeedbackDetail(clubId, result.data.feedbackId),
      result.data,
    );
    void invalidateClubQueries(queryClient, clubId);
    setSelectedDetail(result.data);
    setFeedbackType(result.data.feedbackType);
    setStatusCode(result.data.statusCode);
    setAdminAnswer(result.data.adminAnswer ?? "");
    showToast("피드백 상태를 저장했습니다.", "success");
    void refreshAdminHome(result.data.feedbackId);
  };

  return (
    <div
      className="min-h-screen bg-[#f8f6f6] text-slate-900"
      style={
        {
          "--primary": "#ec5b13",
          "--background-light": "#f8f6f6",
        } as CSSProperties
      }
    >
      <div className="semo-page-admin min-h-screen bg-[var(--background-light)]">
        <ClubPageHeader
          title="비공개 피드백함"
          subtitle={feedbackHome.clubName}
          icon="forum"
          theme="admin"
          containerClassName="semo-page-admin"
        />

        <main className="semo-nav-bottom-space space-y-4 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-[#f2d8c5] bg-[linear-gradient(150deg,#fff1e6_0%,#fff9f4_58%,#f8fbff_100%)] p-5 shadow-[0_20px_46px_rgba(236,91,19,0.1)]"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-xs font-bold tracking-wide text-[var(--primary)]">
              비공개 접수함
            </p>
            <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-slate-950">
              제보자의 신뢰를 지키며
              <br />
              접수부터 답변까지 처리합니다.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              익명 제출은 운영진에게도 작성자가 표시되지 않으며, 접수 내용을 임의로 공개할 수 없습니다.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">
                  총 건수
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  {feedbackHome.totalCount}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">
                  답변 완료
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  {feedbackHome.answeredCount}
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">관리 목록</h3>
                <p className="mt-1 text-sm text-slate-500">
                  처리 상태 기준으로 확인하고 답변할 수 있습니다.
                </p>
              </div>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#ec5b13]">
                검토 중 {feedbackHome.inReviewCount}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={isSaving}
                  onClick={() => setStatusFilter(option.value as StatusFilter)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    statusFilter === option.value
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {filteredItems.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  조건에 맞는 피드백이 없습니다.
                </div>
              ) : (
                filteredItems.map((item, index) => (
                  <motion.button
                    key={item.feedbackId}
                    type="button"
                    disabled={isSaving}
                    onClick={() => void loadDetail(item.feedbackId)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      selectedFeedbackId === item.feedbackId
                        ? "border-[#ec5b13]/35 bg-[#fff6f1]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusTone(item.statusCode)}`}>
                        {item.statusLabel}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getVisibilityTone(item.visibilityScope)}`}>
                        {item.visibilityLabel}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {item.feedbackTypeLabel}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-bold text-slate-950">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {item.contentPreview ?? "내용이 없습니다."}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                      <span>{item.authorDisplayName}</span>
                      <span>{item.createdAtLabel ?? "-"}</span>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.section>

          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">상세 편집</h3>
                <p className="mt-1 text-sm text-slate-500">
                  분류와 처리 상태를 정리하고 작성자에게 답변합니다.
                </p>
              </div>
              {isDetailLoading ? (
                <span className="text-xs font-semibold text-slate-400">불러오는 중...</span>
              ) : null}
            </div>

            {!selectedDetail ? (
              <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                목록에서 피드백을 선택하세요.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-[24px] bg-slate-50 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusTone(selectedDetail.statusCode)}`}>
                      {selectedDetail.statusLabel}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getVisibilityTone(selectedDetail.visibilityScope)}`}>
                      {selectedDetail.visibilityLabel}
                    </span>
                    {selectedDetail.anonymous ? (
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                        익명 제출
                      </span>
                    ) : null}
                  </div>
                  <h4 className="mt-3 text-lg font-black tracking-tight text-slate-950">
                    {selectedDetail.title}
                  </h4>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {selectedDetail.content}
                  </p>
                  <p className="mt-3 text-xs text-slate-400">
                    {selectedDetail.authorDisplayName} · {selectedDetail.createdAtLabel ?? "-"}
                  </p>
                </div>

                <div className="space-y-3">
                  <ResourceAttachmentPanel
                    clubId={clubId}
                    resourceType="FEEDBACK"
                    resourceId={selectedDetail.feedbackId}
                    canUpload={selectedDetail.canManage}
                    canDelete={selectedDetail.canManage}
                    theme="admin"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <fieldset className="space-y-2">
                      <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        분류
                      </legend>
                      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="피드백 분류">
                        {FEEDBACK_TYPE_OPTIONS.map((option) => {
                          const selected = feedbackType === option.value;
                          return (
                            <label
                              key={option.value}
                              className={`semo-control min-w-0 px-2 text-xs font-bold transition ${
                                selected
                                  ? "bg-[#ec5b13] text-white shadow-sm"
                                  : "border border-slate-200 bg-white text-slate-600 hover:border-[#ec5b13]/40 hover:bg-orange-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="feedback-type"
                                value={option.value}
                                checked={selected}
                                disabled={isSaving || isDetailLoading}
                                onChange={() => setFeedbackType(option.value)}
                                className="sr-only"
                              />
                              {option.label}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                    <fieldset className="space-y-2">
                      <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        상태
                      </legend>
                      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="피드백 처리 상태">
                        {STATUS_OPTIONS.map((option) => {
                          const selected = statusCode === option.value;
                          return (
                            <label
                              key={option.value}
                              className={`semo-control px-3 text-xs font-bold transition ${
                                selected
                                  ? "bg-slate-900 text-white shadow-sm"
                                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="feedback-status"
                                value={option.value}
                                checked={selected}
                                disabled={isSaving || isDetailLoading}
                                onChange={() => setStatusCode(option.value)}
                                className="sr-only"
                              />
                              {option.label}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  </div>

                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      운영 답변
                    </span>
                    <textarea
                      value={adminAnswer}
                      disabled={isSaving || isDetailLoading}
                      onChange={(event) => setAdminAnswer(event.target.value)}
                      rows={5}
                      placeholder="답변이 없으면 빈 상태로 저장할 수 있습니다."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#ec5b13] focus:ring-2 focus:ring-[#ec5b13]/10"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="flex w-full items-center justify-center rounded-2xl bg-[#ec5b13] py-3.5 text-sm font-bold text-white transition hover:bg-[#d45110] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {isSaving ? "저장 중..." : "관리 상태 저장"}
                </button>
              </div>
            )}
          </motion.section>
        </main>

      </div>
    </div>
  );
}
