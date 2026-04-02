"use client";

import { motion, useReducedMotion } from "motion/react";
import { startTransition, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { EphemeralToast } from "@/app/components/EphemeralToast";
import { useEphemeralToast } from "@/app/components/useEphemeralToast";
import {
  createClubFeedback,
  getClubFeedbackDetail,
  getClubFeedbackHome,
  type ClubFeedbackDetailResponse,
  type ClubFeedbackHomeResponse,
  type ClubFeedbackStatusCode,
  type ClubFeedbackSummary,
  type ClubFeedbackType,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

type ClubFeedbackClientProps = {
  clubId: string;
  initialData: ClubFeedbackHomeResponse;
  initialDetail: ClubFeedbackDetailResponse | null;
  isAdmin: boolean;
  canPersist?: boolean;
};

type FeedbackFilterKey = "all" | "mine" | "answered" | "public";

const FEEDBACK_TYPE_OPTIONS: Array<{ value: ClubFeedbackType; label: string }> = [
  { value: "SUGGESTION", label: "건의" },
  { value: "INCONVENIENCE", label: "불편 신고" },
  { value: "IMPROVEMENT_REQUEST", label: "개선 요청" },
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
      return "bg-blue-50 text-[#135bec]";
  }
}

function getVisibilityTone(visibilityScope: string) {
  return visibilityScope === "PUBLIC"
    ? "bg-violet-50 text-violet-700"
    : "bg-slate-100 text-slate-600";
}

function matchesFilter(item: ClubFeedbackSummary, filter: FeedbackFilterKey) {
  switch (filter) {
    case "mine":
      return item.mine;
    case "answered":
      return item.answered;
    case "public":
      return item.visibilityScope === "PUBLIC";
    default:
      return true;
  }
}

export function ClubFeedbackClient({
  clubId,
  initialData,
  initialDetail,
  isAdmin,
  canPersist = true,
}: ClubFeedbackClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [feedbackHome, setFeedbackHome] = useState(initialData);
  const [activeFilter, setActiveFilter] = useState<FeedbackFilterKey>("all");
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<number | null>(
    initialDetail?.feedbackId ?? initialData.items[0]?.feedbackId ?? null,
  );
  const [selectedDetail, setSelectedDetail] = useState<ClubFeedbackDetailResponse | null>(
    initialDetail,
  );
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackType, setFeedbackType] = useState<ClubFeedbackType>("SUGGESTION");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const { toast, showToast, clearToast } = useEphemeralToast();

  const filteredItems = useMemo(
    () => feedbackHome.items.filter((item) => matchesFilter(item, activeFilter)),
    [activeFilter, feedbackHome.items],
  );

  const loadDetail = async (feedbackId: number) => {
    setIsDetailLoading(true);
    const result = await getClubFeedbackDetail(clubId, feedbackId);
    setIsDetailLoading(false);
    if (!result.ok || !result.data) {
      showToast(result.message ?? "피드백 상세를 불러오지 못했습니다.", "error");
      return;
    }
    setSelectedFeedbackId(feedbackId);
    setSelectedDetail(result.data);
  };

  const refreshHome = async (nextSelectedFeedbackId?: number | null) => {
    const result = await getClubFeedbackHome(clubId);
    if (!result.ok || !result.data) {
      showToast(result.message ?? "피드백 목록을 새로고침하지 못했습니다.", "error");
      return;
    }
    setFeedbackHome(result.data);
    const fallbackFeedbackId = result.data.items[0]?.feedbackId ?? null;
    const resolvedFeedbackId = nextSelectedFeedbackId ?? fallbackFeedbackId;
    if (resolvedFeedbackId != null) {
      void loadDetail(resolvedFeedbackId);
      return;
    }
    setSelectedFeedbackId(null);
    setSelectedDetail(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      showToast("제목과 내용을 입력해주세요.", "error");
      return;
    }
    if (!canPersist) {
      showToast("Mock mode에서는 피드백 저장이 되지 않습니다.", "info");
      return;
    }

    setIsSubmitting(true);
    clearToast();
    const result = await createClubFeedback(clubId, {
      feedbackType,
      title: title.trim(),
      content: content.trim(),
      anonymous,
    });
    setIsSubmitting(false);

    if (!result.ok || !result.data) {
      showToast(result.message ?? "피드백 등록에 실패했습니다.", "error");
      return;
    }

    startTransition(() => {
      setTitle("");
      setContent("");
      setAnonymous(false);
      setFeedbackType("SUGGESTION");
    });
    setSelectedFeedbackId(result.data.feedbackId);
    setSelectedDetail(result.data);
    showToast("피드백을 등록했습니다.", "success");
    void refreshHome(result.data.feedbackId);
  };

  return (
    <div
      className="min-h-screen bg-[var(--background-light)] text-slate-900"
      style={
        {
          "--primary": "#135bec",
          "--background-light": "#f5f8ff",
        } as CSSProperties
      }
    >
      <div className="mx-auto min-h-screen max-w-md bg-[var(--background-light)]">
        <ClubPageHeader
          title="피드백"
          subtitle={feedbackHome.clubName}
          icon="forum"
          className="border-[#135bec]/10 bg-white/85 backdrop-blur-md"
        />

        <main className="semo-nav-bottom-space space-y-4 px-4 pt-4">
          <motion.section
            className="overflow-hidden rounded-[28px] border border-[#135bec]/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.96)_0%,rgba(243,247,255,0.96)_58%,rgba(228,238,255,0.92)_100%)] p-5 shadow-[0_20px_48px_rgba(19,91,236,0.12)]"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-[var(--primary)]">
              Feedback Box
            </p>
            <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-slate-900">
              불편과 아이디어를
              <br />
              운영팀에게 바로 남기세요.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              익명으로 남길 수 있고, 운영 답변이 달리면 이 화면에서 바로 확인할 수 있습니다.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-white/90 bg-white/85 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  전체 노출
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  {feedbackHome.totalVisibleCount}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/90 bg-white/85 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  내 요청
                </p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  {feedbackHome.mySubmissionCount}
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
                <h3 className="text-base font-bold text-slate-950">새 피드백 남기기</h3>
                <p className="mt-1 text-sm text-slate-500">
                  접수 후 운영진이 분류와 공개 여부를 조정합니다.
                </p>
              </div>
              <label className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(event) => setAnonymous(event.target.checked)}
                  className="size-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                익명
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {FEEDBACK_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFeedbackType(option.value)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                    feedbackType === option.value
                      ? "bg-[var(--primary)] text-white shadow-[0_14px_28px_rgba(19,91,236,0.22)]"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
              />
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="상황과 개선 의견을 자세히 적어주세요"
                rows={5}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] py-3.5 text-sm font-bold text-white transition hover:bg-[#0f4fd1] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {isSubmitting ? "등록 중..." : "피드백 보내기"}
            </button>
          </motion.section>

          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(2, reduceMotion)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">피드백 목록</h3>
                <p className="mt-1 text-sm text-slate-500">
                  공개된 답변과 내가 남긴 요청을 함께 봅니다.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                답변 {feedbackHome.answeredCount}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: "all", label: "전체" },
                { key: "mine", label: "내 요청" },
                { key: "answered", label: "답변 완료" },
                { key: "public", label: "공개" },
              ].map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key as FeedbackFilterKey)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    activeFilter === filter.key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {filter.label}
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
                    onClick={() => void loadDetail(item.feedbackId)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      selectedFeedbackId === item.feedbackId
                        ? "border-[var(--primary)]/35 bg-[var(--primary)]/5"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                    {...staggeredFadeUpMotion(index + 3, reduceMotion)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusTone(item.statusCode)}`}>
                        {item.statusLabel}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getVisibilityTone(item.visibilityScope)}`}>
                        {item.visibilityLabel}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
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
            {...staggeredFadeUpMotion(3, reduceMotion)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">상세</h3>
                <p className="mt-1 text-sm text-slate-500">
                  운영 답변과 공개 상태를 확인할 수 있습니다.
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusTone(selectedDetail.statusCode)}`}>
                    {selectedDetail.statusLabel}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getVisibilityTone(selectedDetail.visibilityScope)}`}>
                    {selectedDetail.visibilityLabel}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                    {selectedDetail.feedbackTypeLabel}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black tracking-tight text-slate-950">
                    {selectedDetail.title}
                  </h4>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {selectedDetail.content}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  작성자 {selectedDetail.authorDisplayName} · {selectedDetail.createdAtLabel ?? "-"}
                </div>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    운영 답변
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {selectedDetail.adminAnswer ?? "아직 운영 답변이 등록되지 않았습니다."}
                  </p>
                  {selectedDetail.answeredAtLabel ? (
                    <p className="mt-3 text-xs text-slate-400">
                      {selectedDetail.answeredByDisplayName ?? "운영진"} · {selectedDetail.answeredAtLabel}
                    </p>
                  ) : null}
                </div>
              </div>
            )}
          </motion.section>
        </main>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <EphemeralToast toastId={toast?.id ?? null} message={toast?.message ?? null} tone={toast?.tone} />
      </div>
    </div>
  );
}
