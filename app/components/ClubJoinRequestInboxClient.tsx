"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { useAppAlert } from "@/app/hooks/useAppAlert";
import { useAppToast } from "@/app/hooks/useAppToast";
import {
  type ClubJoinRequestInboxItem,
  type ClubJoinRequestInboxResponse,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import { reviewJoinRequestMutationOptions } from "@/app/lib/react-query/members/mutations";

type ClubJoinRequestInboxClientProps = {
  clubId: string;
  initialData: ClubJoinRequestInboxResponse;
};

function isRequestedToday(value: string | null) {
  if (!value) {
    return false;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }
  const now = new Date();
  return parsed.toDateString() === now.toDateString();
}

function buildSearchText(item: ClubJoinRequestInboxItem) {
  return [item.displayName, item.tagline ?? "", item.requestMessage ?? ""].join(" ").toLowerCase();
}

function RequestAvatar({
  item,
  accentColor,
}: {
  item: ClubJoinRequestInboxItem;
  accentColor: string;
}) {
  return (
    <div
      className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-card)] text-sm font-black text-white shadow-[0_14px_32px_rgba(15,23,42,0.16)]"
      style={{ backgroundColor: item.profileColor ?? accentColor }}
    >
      {item.displayName.slice(0, 2)}
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function JoinRequestCard({
  item,
  canReview,
  reviewing,
  accentClassName,
  accentColor,
  onReview,
}: {
  item: ClubJoinRequestInboxItem;
  canReview: boolean;
  reviewing: boolean;
  accentClassName: string;
  accentColor: string;
  onReview?: (requestStatus: "APPROVED" | "REJECTED") => void;
}) {
  return (
    <article className="rounded-[var(--radius-modal)] border border-slate-200/80 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.08)]">
      <div className="flex items-start gap-4">
        <RequestAvatar item={item} accentColor={accentColor} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-black tracking-tight text-slate-900">{item.displayName}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] ${accentClassName}`}
            >
              대기 중
            </span>
            {isRequestedToday(item.requestedAt) ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                오늘
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">
            <span>접수 {item.requestedAtLabel ?? "-"}</span>
            {item.tagline ? <span>{item.tagline}</span> : null}
          </div>

          <div className="mt-4 rounded-[var(--radius-card)] bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            {item.requestMessage?.trim() || "신청 메시지가 아직 남겨지지 않았습니다."}
          </div>
        </div>
      </div>

      {canReview && onReview ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={reviewing}
            onClick={() => onReview("APPROVED")}
            className="rounded-2xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reviewing ? "처리 중..." : "승인"}
          </button>
          <button
            type="button"
            disabled={reviewing}
            onClick={() => onReview("REJECTED")}
            className="rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            반려
          </button>
          <RouterLink
            href={`/clubs/${item.clubId}/admin/members`}
            className="rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
          >
            멤버 관리
          </RouterLink>
        </div>
      ) : null}
    </article>
  );
}

export function ClubJoinRequestInboxClient({
  clubId,
  initialData,
}: ClubJoinRequestInboxClientProps) {
  const queryClient = useQueryClient();
  const reduceMotion = useHydrationSafeReducedMotion();
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState(initialData.requests);
  const [reviewingJoinRequestId, setReviewingJoinRequestId] = useState<number | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { showToast } = useAppToast();
  const { showAlert } = useAppAlert();
  const reviewJoinRequestMutation = useMutation(reviewJoinRequestMutationOptions(clubId));

  const filteredRequests = useMemo(() => {
    if (!deferredQuery) {
      return requests;
    }
    return requests.filter((item) => buildSearchText(item).includes(deferredQuery));
  }, [deferredQuery, requests]);

  const requestedTodayCount = useMemo(
    () => requests.filter((item) => isRequestedToday(item.requestedAt)).length,
    [requests],
  );
  const messageAttachedCount = useMemo(
    () => requests.filter((item) => Boolean(item.requestMessage?.trim())).length,
    [requests],
  );
  const latestRequestedAtLabel = requests[0]?.requestedAtLabel ?? null;
  const highlightedApplicants = requests.slice(0, 3).map((item) => item.displayName).join(" · ");

  const handleReview = async (
    item: ClubJoinRequestInboxItem,
    requestStatus: "APPROVED" | "REJECTED",
  ) => {
    setReviewingJoinRequestId(item.clubJoinRequestId);
    const result = await reviewJoinRequestMutation.mutateAsync({
      clubJoinRequestId: item.clubJoinRequestId,
      requestStatus,
    });

    if (!result.ok || !result.data) {
      setReviewingJoinRequestId(null);
      showAlert({
        title: requestStatus === "APPROVED" ? "가입 승인 실패" : "가입 반려 실패",
        message: result.message ?? "가입 신청 처리에 실패했습니다.",
        tone: "danger",
      });
      return;
    }

    setRequests((current) =>
      current.filter((request) => request.clubJoinRequestId !== item.clubJoinRequestId),
    );
    await invalidateClubQueries(queryClient, clubId);
    setReviewingJoinRequestId(null);
    showToast(
      requestStatus === "APPROVED"
        ? `${item.displayName} 가입 신청을 승인했습니다.`
        : `${item.displayName} 가입 신청을 반려했습니다.`,
    );
  };

  const primaryColor = "var(--primary)";
  const containerClassName = "max-w-5xl";
  const accentClassName = "bg-[var(--primary)]/10 text-[var(--primary)]";

  return (
    <div className="semo-app-shell text-slate-900">
      <div className={`mx-auto min-h-full ${containerClassName}`}>
        <ClubPageHeader
          title="신규가입 운영"
          subtitle={initialData.clubName}
          icon="group_add"
          theme="admin"
          containerClassName={containerClassName}
        />

        <main className="semo-nav-bottom-space space-y-4 px-4 pt-4">
          <motion.section
            className="relative overflow-hidden rounded-[var(--radius-modal)] border border-[var(--primary)]/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.96)_0%,rgba(255,246,240,0.96)_54%,rgba(255,235,223,0.9)_100%)] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-[var(--primary)]/10 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--primary)]">
                가입 요청
              </p>
              <h2 className="mt-3 text-[28px] font-black tracking-[-0.04em] text-slate-900">
                가입 승인 대기열을 운영하고
                <br />
                가입 이후 운영 동선까지 이어갑니다.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                가입 신청은 루트 홈에서 그대로 접수하고, 이 화면에서는 현재 대기열과 운영 상태를
                분리해서 다룹니다.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">현재 대기열 하이라이트</p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {highlightedApplicants || "지금은 검토 중인 가입 신청이 없습니다."}
                  </p>
                </div>
                <div className="rounded-[var(--radius-card)] bg-slate-900 px-4 py-3 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                  <p className="text-xs font-semibold text-white/60">대기 중</p>
                  <p className="mt-1 text-2xl font-black tracking-tight">{requests.length}</p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <SummaryMetric
                  label="오늘 접수"
                  value={requestedTodayCount.toLocaleString("ko-KR")}
                  detail="오늘 새로 도착한 가입 신청 수입니다."
                />
                <SummaryMetric
                  label="메시지 작성"
                  value={messageAttachedCount.toLocaleString("ko-KR")}
                  detail="자기소개나 지원 메시지를 남긴 신청 수입니다."
                />
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-[var(--radius-modal)] border border-slate-200/80 bg-white/90 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur"
            {...staggeredFadeUpMotion(1, reduceMotion)}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">운영 노트</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {latestRequestedAtLabel
                    ? `가장 최근 접수 ${latestRequestedAtLabel}`
                    : "현재 비어 있는 대기열입니다."}
                </p>
              </div>
              <RouterLink
                href={`/clubs/${clubId}/admin/members`}
                className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200"
              >
                멤버 관리 보기
              </RouterLink>
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-[var(--radius-card)] border border-slate-200 bg-slate-50/90 px-4 py-3 transition focus-within:border-[var(--primary)]/30 focus-within:bg-white">
              <span className="material-symbols-outlined text-slate-400" aria-hidden="true">search</span>
              <input
                value={query}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  startTransition(() => {
                    setQuery(nextValue);
                  });
                }}
                aria-label="가입 신청 검색"
                placeholder="신청자 이름, 소개, 메시지 검색"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
              />
            </label>
          </motion.section>

          {filteredRequests.length === 0 ? (
            <motion.section
              className="rounded-[var(--radius-modal)] border border-dashed border-slate-200 bg-white px-5 py-10 text-center shadow-sm"
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              <p className="text-base font-black tracking-tight text-slate-900">
                {requests.length === 0
                  ? "지금 검토할 신규가입 신청이 없습니다."
                  : "검색 조건에 맞는 가입 신청이 없습니다."}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                새 신청이 들어오면 이 화면에서 승인과 반려를 분리해서 처리할 수 있습니다.
              </p>
            </motion.section>
          ) : (
            <section className="space-y-3">
              {filteredRequests.map((item, index) => (
                <motion.div
                  key={item.clubJoinRequestId}
                  {...staggeredFadeUpMotion(index + 2, reduceMotion)}
                >
                  <JoinRequestCard
                    item={item}
                    canReview
                    reviewing={reviewingJoinRequestId === item.clubJoinRequestId}
                    accentClassName={accentClassName}
                    accentColor={primaryColor}
                    onReview={(requestStatus) => {
                      void handleReview(item, requestStatus);
                    }}
                  />
                </motion.div>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
