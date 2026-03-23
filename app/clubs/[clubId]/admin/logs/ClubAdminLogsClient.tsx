"use client";

import { useState } from "react";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { RouterLink } from "@/app/components/RouterLink";
import {
  getClubAdminActivities,
  type ClubAdminActivityFeedResponse,
  type ClubAdminActivityItem,
} from "@/app/lib/clubs";
import { motion, useReducedMotion } from "motion/react";
import { staggeredFadeUpMotion } from "@/app/lib/motion";

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
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [items, setItems] = useState<ClubAdminActivityItem[]>(initialData.activities);
  const [nextCursorCreatedAt, setNextCursorCreatedAt] = useState<string | null>(initialData.nextCursorCreatedAt);
  const [nextCursorActivityId, setNextCursorActivityId] = useState<number | null>(initialData.nextCursorActivityId);
  const [hasNext, setHasNext] = useState(initialData.hasNext);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasNext) {
      return;
    }
    setIsLoadingMore(true);
    setLoadError(null);
    const result = await getClubAdminActivities(clubId, {
      size: 20,
      cursorCreatedAt: nextCursorCreatedAt,
      cursorActivityId: nextCursorActivityId,
    });
    setIsLoadingMore(false);

    if (!result.ok || !result.data) {
      setLoadError(result.message ?? "활동 로그를 더 불러오지 못했습니다.");
      return;
    }

    const data = result.data;
    setItems((current) => [...current, ...data.activities]);
    setNextCursorCreatedAt(data.nextCursorCreatedAt);
    setNextCursorActivityId(data.nextCursorActivityId);
    setHasNext(data.hasNext);
  };

  return (
    <div className="min-h-screen bg-[#f8f6f6] text-slate-900">
      <div className="mx-auto min-h-screen max-w-4xl bg-[#f8f6f6] pb-28">
        <ClubPageHeader
          title="전체 활동 로그"
          subtitle={clubName}
          icon="history"
          theme="admin"
          containerClassName="max-w-4xl"
          className="bg-[#f8f6f6]/90"
        />

        <main className="semo-nav-bottom-space space-y-5 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Activity Feed</p>
                <h2 className="mt-2 text-2xl font-bold">최근 관리자 활동 전체 보기</h2>
                <p className="mt-2 text-sm text-slate-500">
                  최신 활동 20개씩 커서 기준으로 이어서 불러옵니다.
                </p>
              </div>
              <RouterLink
                href={`/clubs/${clubId}/admin`}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                관리자 홈
              </RouterLink>
            </div>
          </motion.section>

          <section className="space-y-3">
            {items.length === 0 ? (
              <motion.div
                className="rounded-[28px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm"
                {...staggeredFadeUpMotion(1, reduceMotion)}
              >
                아직 기록된 활동이 없습니다.
              </motion.div>
            ) : (
              items.map((activity, index) => (
                <motion.article
                  key={`${activity.activityId}-${index}`}
                  className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
                  {...staggeredFadeUpMotion(index + 1, reduceMotion)}
                >
                  <div className="flex gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#ec5b13]/10 text-sm font-bold text-[#ec5b13]">
                      {activity.actorAvatarLabel}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{activity.actorDisplayName}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {activity.subject}
                        </span>
                        {activity.status === "FAIL" ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                            실패
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
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
                        <div className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-xs leading-relaxed text-red-600">
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
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</div>
          ) : null}

          {hasNext ? (
            <motion.div {...staggeredFadeUpMotion(items.length + 2, reduceMotion)}>
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-[#ec5b13] px-5 py-4 text-sm font-bold text-white shadow-lg shadow-[#ec5b13]/20 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isLoadingMore ? "progress_activity" : "expand_more"}
                </span>
                {isLoadingMore ? "불러오는 중..." : "활동 20개 더 보기"}
              </button>
            </motion.div>
          ) : items.length > 0 ? (
            <div className="pb-4 text-center text-sm text-slate-400">마지막 활동까지 모두 불러왔습니다.</div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
