"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import {
  type ClubTimelineEntry,
  type ClubTimelineResponse,
} from "@/app/lib/clubs";
import { motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { timelineInfiniteQueryOptions } from "@/app/lib/react-query/activities/queries";

type ClubTimelineClientProps = {
  clubId: string;
  initialData: ClubTimelineResponse;
  isAdmin: boolean;
};

type TimelineListItem =
  | { type: "separator"; key: string; label: string }
  | { type: "entry"; key: string; entry: ClubTimelineEntry };

const SUBJECT_META: Record<
  string,
  {
    icon: string;
    avatarClassName: string;
    badgeClassName: string;
  }
> = {
  공지관리: {
    icon: "campaign",
    avatarClassName: "bg-blue-50 text-blue-600 ring-blue-100",
    badgeClassName: "bg-blue-50 text-blue-700",
  },
  일정관리: {
    icon: "calendar_month",
    avatarClassName: "bg-amber-50 text-amber-600 ring-amber-100",
    badgeClassName: "bg-amber-50 text-amber-700",
  },
  투표관리: {
    icon: "how_to_vote",
    avatarClassName: "bg-sky-50 text-sky-600 ring-sky-100",
    badgeClassName: "bg-sky-50 text-sky-700",
  },
  출석관리: {
    icon: "fact_check",
    avatarClassName: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    badgeClassName: "bg-emerald-50 text-emerald-700",
  },
  멤버관리: {
    icon: "groups",
    avatarClassName: "bg-orange-50 text-orange-600 ring-orange-100",
    badgeClassName: "bg-orange-50 text-orange-700",
  },
  기능관리: {
    icon: "widgets",
    avatarClassName: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    badgeClassName: "bg-indigo-50 text-indigo-700",
  },
  직책관리: {
    icon: "manage_accounts",
    avatarClassName: "bg-cyan-50 text-cyan-600 ring-cyan-100",
    badgeClassName: "bg-cyan-50 text-cyan-700",
  },
  모임관리: {
    icon: "apartment",
    avatarClassName: "bg-slate-100 text-slate-700 ring-slate-200",
    badgeClassName: "bg-slate-100 text-slate-700",
  },
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getGroupLabel(isoValue: string) {
  const now = new Date();
  const target = new Date(isoValue);
  const diffDays = Math.floor(
    (startOfDay(now).getTime() - startOfDay(target).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) {
    return "오늘";
  }
  if (diffDays === 1) {
    return "어제";
  }
  if (diffDays < 7) {
    return "이번 주";
  }

  return `${target.getFullYear()}년 ${target.getMonth() + 1}월`;
}

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

function getSubjectMeta(subject: string) {
  return SUBJECT_META[subject] ?? {
    icon: "timeline",
    avatarClassName: "bg-slate-100 text-slate-700 ring-slate-200",
    badgeClassName: "bg-slate-100 text-slate-700",
  };
}

export function ClubTimelineClient({
  clubId,
  initialData,
  isAdmin,
}: ClubTimelineClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const timelineQuery = useInfiniteQuery(timelineInfiniteQueryOptions(clubId, initialData));
  const timeline = useMemo<ClubTimelineResponse>(() => {
    const pages = timelineQuery.data?.pages;
    if (!pages || pages.length === 0) {
      return initialData;
    }
    const lastPage = pages[pages.length - 1] ?? initialData;
    return {
      ...lastPage,
      entries: pages.flatMap((page: ClubTimelineResponse) => page.entries),
    };
  }, [initialData, timelineQuery.data]);
  const loading = timelineQuery.isFetchingNextPage;
  const feedback = timelineQuery.isFetchNextPageError ? "타임라인을 불러오지 못했습니다." : null;

  useEffect(() => {
    if (!sentinelNode || !timelineQuery.hasNextPage || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }
        void timelineQuery.fetchNextPage();
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(sentinelNode);
    return () => {
      observer.disconnect();
    };
  }, [loading, sentinelNode, timelineQuery]);

  const renderedItems = useMemo<TimelineListItem[]>(() => {
    const items: TimelineListItem[] = [];
    let previousLabel: string | null = null;

    timeline.entries.forEach((entry) => {
      const label = getGroupLabel(entry.createdAt ?? new Date().toISOString());
      if (label !== previousLabel) {
        items.push({ type: "separator", key: `separator-${label}-${entry.activityId}`, label });
        previousLabel = label;
      }
      items.push({ type: "entry", key: `entry-${entry.activityId}`, entry });
    });

    return items;
  }, [timeline.entries]);

  return (
    <div className="min-h-full bg-[var(--background-light)] text-slate-900">
      <div className="mx-auto flex min-h-full max-w-md flex-col bg-[var(--background-light)]">
        <ClubPageHeader
          title="타임라인"
          icon="timeline"
          subtitle={initialData.clubName}
          className="border-[#135bec]/10 bg-white/85 backdrop-blur-md"
        />

        <main className="semo-nav-bottom-space flex-1 px-4 pt-4">
          <motion.section
            className="rounded-[28px] border border-[#135bec]/10 bg-white px-5 py-4 shadow-sm"
            {...staggeredFadeUpMotion(0, reduceMotion)}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#135bec]/60">
              My Activity Timeline
            </p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">내가 남긴 활동만 시간순으로 확인</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              내가 작성하거나 실행한 공지, 일정, 투표, 출석, 운영 액션만 한 흐름으로 보여줍니다.
            </p>
          </motion.section>

          <div className="relative mt-5">
            <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-[#135bec]/10" />
            <div className="space-y-6">
              {renderedItems.map((item, index) => {
                if (item.type === "separator") {
                  return (
                    <div key={item.key} className="relative flex justify-center py-2">
                      <span className="z-10 bg-[var(--background-light)] px-4 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                        {item.label}
                      </span>
                      <div className="absolute inset-x-0 top-1/2 h-px bg-[#135bec]/5" />
                    </div>
                  );
                }

                const subjectMeta = getSubjectMeta(item.entry.subject);
                const relativeTime = formatRelativeTime(
                  item.entry.createdAt,
                  item.entry.createdAtLabel,
                );
                return (
                  <motion.div
                    key={item.key}
                    className="relative grid grid-cols-[40px_1fr] gap-x-4 items-start"
                    {...staggeredFadeUpMotion(index, reduceMotion)}
                  >
                    <div
                      className={`z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white ring-2 ${subjectMeta.avatarClassName}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {subjectMeta.icon}
                      </span>
                    </div>
                    <article
                      className={`rounded-[24px] border bg-white p-4 shadow-sm ${
                        item.entry.status === "FAIL"
                          ? "border-rose-100"
                          : "border-[#135bec]/5"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${subjectMeta.badgeClassName}`}
                        >
                          {item.entry.subject}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">
                          {item.entry.actorDisplayName || "알 수 없는 사용자"}
                        </span>
                        <span className="text-xs text-slate-400">{relativeTime}</span>
                        {item.entry.status === "FAIL" ? (
                          <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600">
                            실패
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-base font-semibold leading-relaxed text-slate-900">
                        {item.entry.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                          {item.entry.actorAvatarLabel}
                        </span>
                        {item.entry.createdAtLabel ? (
                          <span>{item.entry.createdAtLabel}</span>
                        ) : null}
                      </div>
                      {item.entry.status === "FAIL" ? (
                        <div className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs leading-relaxed text-rose-600">
                          처리되지 않은 작업으로 기록되었습니다.
                        </div>
                      ) : null}
                    </article>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {!loading && timeline.entries.length === 0 ? (
            <motion.div
              className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500"
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              아직 내가 남긴 타임라인 기록이 없습니다.
            </motion.div>
          ) : null}

          {feedback ? (
            <motion.div
              className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
              {...staggeredFadeUpMotion(3, reduceMotion)}
            >
              {feedback}
            </motion.div>
          ) : null}

          {loading && timeline.entries.length > 0 ? (
            <div className="py-2 text-center text-sm text-slate-400">활동을 더 불러오는 중...</div>
          ) : null}

          <div ref={setSentinelNode} className="h-16" />
        </main>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
      </div>
    </div>
  );
}
