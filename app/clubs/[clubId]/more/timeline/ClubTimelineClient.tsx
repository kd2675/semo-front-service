"use client";

import { ClubNoticeDetailModal } from "@/app/components/ClubDetailModals";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import {
  getClubTimeline,
  type ClubTimelineEntry,
  type ClubTimelineResponse,
} from "@/app/lib/clubs";
import { getLinkedContentBadge } from "@/app/lib/content-badge";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";

type ClubTimelineClientProps = {
  clubId: string;
  initialData: ClubTimelineResponse;
  isAdmin: boolean;
};

type CursorState = {
  publishedAt: string | null;
  noticeId: number | null;
};

type TimelineListItem =
  | { type: "separator"; key: string; label: string }
  | { type: "entry"; key: string; entry: ClubTimelineEntry };

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

export function ClubTimelineClient({
  clubId,
  initialData,
  isAdmin,
}: ClubTimelineClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [timeline, setTimeline] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [detailNoticeId, setDetailNoticeId] = useState<string | null>(null);
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const cursor: CursorState = {
    publishedAt: timeline.nextCursorPublishedAt,
    noticeId: timeline.nextCursorNoticeId,
  };

  const loadTimeline = useEffectEvent(async (mode: "reset" | "append") => {
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setFeedback(null);

    const result = await getClubTimeline(clubId, {
      cursorPublishedAt: mode === "append" ? cursor.publishedAt : null,
      cursorNoticeId: mode === "append" ? cursor.noticeId : null,
      size: 12,
    });

    loadingRef.current = false;
    setLoading(false);

    if (!result.ok || !result.data) {
      setFeedback(result.message ?? "타임라인을 불러오지 못했습니다.");
      return;
    }

    const nextTimeline = result.data;

    setTimeline((current) => ({
      ...nextTimeline,
      entries:
        mode === "append" ? [...current.entries, ...nextTimeline.entries] : nextTimeline.entries,
    }));
  });

  useEffect(() => {
    if (!sentinelNode || !timeline.hasNext || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }
        void loadTimeline("append");
      },
      { rootMargin: "220px 0px" },
    );

    observer.observe(sentinelNode);
    return () => {
      observer.disconnect();
    };
  }, [loading, sentinelNode, timeline.hasNext]);

  const renderedItems = useMemo<TimelineListItem[]>(() => {
    const items: TimelineListItem[] = [];
    let previousLabel: string | null = null;

    timeline.entries.forEach((entry) => {
      const label = getGroupLabel(entry.publishedAt);
      if (label !== previousLabel) {
        items.push({ type: "separator", key: `separator-${label}-${entry.noticeId}`, label });
        previousLabel = label;
      }
      items.push({ type: "entry", key: `entry-${entry.noticeId}`, entry });
    });

    return items;
  }, [timeline.entries]);

  return (
    <div className="min-h-full bg-[var(--background-light)] text-slate-900">
      <div className="mx-auto flex min-h-full max-w-md flex-col bg-[var(--background-light)]">
        <ClubPageHeader
          title="타임라인"
          icon="timeline"
          className="border-[#135bec]/10 bg-white/85 backdrop-blur-md"
        />

        <main className="semo-nav-bottom-space flex-1 px-4 pt-4">
          <div className="relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-[#135bec]/10" />
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

                const badge = getLinkedContentBadge(item.entry.linkedTargetType);
                return (
                  <motion.div
                    key={item.key}
                    className="relative grid grid-cols-[40px_1fr] gap-x-4 items-start"
                    {...staggeredFadeUpMotion(index, reduceMotion)}
                  >
                    <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[#135bec] ring-2 ring-[#135bec]/20">
                      <span className="material-symbols-outlined text-[20px]">
                        campaign
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailNoticeId(String(item.entry.noticeId));
                      }}
                      className="rounded-2xl border border-[#135bec]/5 bg-white p-4 text-left shadow-sm transition-transform hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${badge.className}`}>
                          {badge.label}
                        </span>
                        {item.entry.pinned ? (
                          <span className="text-[11px] font-bold text-slate-400">핀 고정</span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-base font-semibold leading-snug text-slate-900">
                        {item.entry.title}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {item.entry.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          {item.entry.authorDisplayName}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span className="text-xs text-slate-500">{item.entry.timeAgo}</span>
                        {item.entry.scheduleAtLabel ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-xs text-slate-500">{item.entry.scheduleAtLabel}</span>
                          </>
                        ) : null}
                      </div>
                      {item.entry.locationLabel ? (
                        <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          <span>{item.entry.locationLabel}</span>
                        </div>
                      ) : null}
                    </button>
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
              등록된 타임라인 기록이 없습니다.
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

          <div ref={setSentinelNode} className="h-16" />
        </main>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <AnimatePresence>
          {detailNoticeId ? (
            <ClubNoticeDetailModal
              clubId={clubId}
              noticeId={detailNoticeId}
              onRequestClose={() => setDetailNoticeId(null)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
