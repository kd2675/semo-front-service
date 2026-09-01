"use client";

import { useEffect, useMemo, useState } from "react";

import { useInfiniteQuery } from "@tanstack/react-query";
import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouterLink } from "@/app/components/RouterLink";
import { type ClubAdminActivityFeedResponse } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { adminActivitiesInfiniteQueryOptions } from "@/app/lib/react-query/activities/queries";

type ClubAdminLogsClientProps = {
  clubId: string;
  clubName: string;
  initialData: ClubAdminActivityFeedResponse;
};

function formatRelativeTime(value: string | null, fallback: string | null) {
  if (!value) {
    return fallback ?? "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback ?? "";
  }

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.max(Math.floor(diffMs / 60000), 0);
  if (diffMinutes < 1) {
    return "방금 전";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }
  return fallback ?? parsed.toLocaleString("ko-KR");
}

export function ClubAdminLogsClient({ clubId, clubName, initialData }: ClubAdminLogsClientProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const logsQuery = useInfiniteQuery(adminActivitiesInfiniteQueryOptions(clubId, initialData, selectedPositionId));
  const items = useMemo(
    () => logsQuery.data?.pages?.flatMap((page) => page.activities) ?? (selectedPositionId == null ? initialData.activities : []),
    [initialData.activities, logsQuery.data, selectedPositionId],
  );
  const positionFilters = logsQuery.data?.pages?.[0]?.positionFilters ?? initialData.positionFilters;
  const hasNext = logsQuery.hasNextPage;
  const isLoadingMore = logsQuery.isFetchingNextPage;
  const loadError = logsQuery.isFetchNextPageError
    ? "활동 로그를 더 불러오지 못했습니다."
    : null;

  useEffect(() => {
    if (!sentinelNode || !hasNext || isLoadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }
        void logsQuery.fetchNextPage();
      },
      { rootMargin: "260px 0px" },
    );

    observer.observe(sentinelNode);
    return () => {
      observer.disconnect();
    };
  }, [hasNext, isLoadingMore, logsQuery, sentinelNode]);

  return (
    <div className="min-h-screen bg-[#f8f6f6] text-slate-900">
      <div className="semo-page-admin min-h-screen bg-[var(--background-light)] pb-28">
        <ClubPageHeader
          title="전체 활동 로그"
          subtitle={clubName}
          icon="history"
          theme="admin"
          containerClassName="semo-page-admin"
          className="bg-[#f8f6f6]/90"
        />

        <main className="semo-nav-bottom-space space-y-5 px-4 pt-4">
          <motion.section
            className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-400">활동 기록</p>
                <h2 className="mt-2 text-2xl font-bold">최근 관리자 활동 전체 보기</h2>
                <p className="mt-2 text-sm text-slate-500">
                  화면 하단까지 내려가면 최신 활동 20개씩 자동으로 이어서 불러옵니다.
                </p>
              </div>
              <RouterLink
                href={`/clubs/${clubId}/admin`}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
                관리자 홈
              </RouterLink>
            </div>
            {positionFilters.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPositionId(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    selectedPositionId == null
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  전체 직책
                </button>
                {positionFilters.map((position) => (
                  <button
                    key={position.clubPositionId}
                    type="button"
                    onClick={() => setSelectedPositionId(position.clubPositionId)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      selectedPositionId === position.clubPositionId
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {position.displayName}
                  </button>
                ))}
              </div>
            ) : null}
          </motion.section>

          <section className="space-y-3">
            {items.length === 0 ? (
              <motion.div
                className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm"
                {...staggeredFadeUpMotion(1, reduceMotion)}
              >
                아직 기록된 활동이 없습니다.
              </motion.div>
            ) : (
              items.map((activity, index) => (
                <motion.article
                  key={`${activity.activityId}-${index}`}
                  className="rounded-[var(--radius-modal)] border border-slate-200 bg-white p-5 shadow-sm"
                  {...staggeredFadeUpMotion(index + 1, reduceMotion)}
                >
                  <div className="flex gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-bold text-[var(--primary)]">
                      {activity.actorAvatarLabel}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{activity.actorDisplayName}</span>
                        {activity.actorPositions.map((position) => (
                          <span
                            key={`${activity.activityId}-${position.clubPositionId}`}
                            className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700"
                          >
                            {position.displayName}
                          </span>
                        ))}
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {activity.subject}
                        </span>
                        {activity.status === "FAIL" ? (
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                            실패
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                            성공
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-700">{activity.detail}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>{formatRelativeTime(activity.createdAt, activity.createdAtLabel)}</span>
                        {activity.createdAtLabel ? <span>{activity.createdAtLabel}</span> : null}
                      </div>
                      {activity.status === "FAIL" && activity.errorMessage ? (
                        <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs leading-relaxed text-rose-600">
                          {activity.errorMessage}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </motion.article>
              ))
            )}
          </section>

          {loadError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{loadError}</div>
          ) : null}

          {hasNext ? (
            <motion.div
              className="rounded-[var(--radius-card)] border border-dashed border-slate-200 bg-white/70 px-5 py-4 text-center text-sm text-slate-400"
              {...staggeredFadeUpMotion(items.length + 2, reduceMotion)}
            >
              {isLoadingMore ? "활동을 더 불러오는 중..." : "스크롤을 내리면 다음 활동을 자동으로 불러옵니다."}
            </motion.div>
          ) : items.length > 0 ? (
            <div className="pb-4 text-center text-sm text-slate-400">마지막 활동까지 모두 불러왔습니다.</div>
          ) : null}

          <div ref={setSentinelNode} className="h-16" />
        </main>
      </div>
    </div>
  );
}
