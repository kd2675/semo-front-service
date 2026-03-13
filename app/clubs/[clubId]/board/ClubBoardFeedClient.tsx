"use client";

import Link from "next/link";
import { AnimatePresence } from "motion/react";
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { ClubBottomNav } from "@/app/components/ClubBottomNav";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { RouteModal } from "@/app/components/RouteModal";
import {
  getClubNoticeFeed,
  type ClubNoticeFeedResponse,
  type ClubNoticeListItem,
  type NoticeFeedCategory,
} from "@/app/lib/clubs";
import { toDateTimeLocalString } from "@/app/lib/date-time";
import { ClubNoticeEditorClient } from "./ClubNoticeEditorClient";

const CATEGORIES: Array<{ id: NoticeFeedCategory; label: string }> = [
  { id: "all", label: "All Posts" },
  { id: "announcement", label: "Announcements" },
  { id: "tournament", label: "Tournaments" },
  { id: "match", label: "Matches" },
  { id: "social", label: "Social" },
];

const CATEGORY_ICON: Record<string, string> = {
  ANNOUNCEMENT: "campaign",
  TOURNAMENT: "emoji_events",
  MATCH: "sports_tennis",
  SOCIAL: "celebration",
};

type CursorState = {
  publishedAt: string | null;
  noticeId: number | null;
};

type ClubBoardFeedClientProps = {
  clubId: string;
};

type NoticeCreateDefaults = {
  scheduleAt: string;
  scheduleEndAt: string;
};

export function ClubBoardFeedClient({ clubId }: ClubBoardFeedClientProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<NoticeFeedCategory>("all");
  const [items, setItems] = useState<ClubNoticeListItem[]>([]);
  const [clubName, setClubName] = useState("Notice Board");
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<NoticeCreateDefaults | null>(null);
  const [cursor, setCursor] = useState<CursorState>({ publishedAt: null, noticeId: null });
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const deferredQuery = useDeferredValue(query);
  const loadingRef = useRef(false);

  const loadFeed = useEffectEvent(async (mode: "reset" | "append") => {
    if (loadingRef.current) {
      return;
    }

    if (mode === "reset") {
      setItems([]);
      setHasNext(false);
      setCursor({ publishedAt: null, noticeId: null });
      setInitialLoaded(false);
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const result = await getClubNoticeFeed(clubId, {
      category: activeCategory,
      query: deferredQuery.trim(),
      cursorPublishedAt: mode === "append" ? cursor.publishedAt : null,
      cursorNoticeId: mode === "append" ? cursor.noticeId : null,
      size: 10,
    });

    loadingRef.current = false;
    setLoading(false);
    setInitialLoaded(true);

    if (!result.ok || !result.data) {
      setError(result.message ?? "공지 피드를 불러오지 못했습니다.");
      return;
    }

    const payload: ClubNoticeFeedResponse = result.data;
    setClubName(payload.clubName);
    setIsAdmin(payload.admin);
    setHasNext(payload.hasNext);
    setCursor({
      publishedAt: payload.nextCursorPublishedAt,
      noticeId: payload.nextCursorNoticeId,
    });
    setItems((current) => (mode === "append" ? [...current, ...payload.notices] : payload.notices));
  });

  useEffect(() => {
    void loadFeed("reset");
  }, [clubId, activeCategory, deferredQuery]);

  useEffect(() => {
    if (!sentinelNode || !hasNext || loading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }
        void loadFeed("append");
      },
      { rootMargin: "240px 0px" },
    );

    observer.observe(sentinelNode);
    return () => {
      observer.disconnect();
    };
  }, [hasNext, loading, sentinelNode]);

  const openCreateModal = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    setCreateDefaults({
      scheduleAt: toDateTimeLocalString(now),
      scheduleEndAt: toDateTimeLocalString(oneHourLater),
    });
    setShowCreateModal(true);
  };

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative flex min-h-screen max-w-md flex-col overflow-hidden bg-white mx-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <Link
            href={`/clubs/${clubId}`}
            className="flex size-10 items-center justify-start text-slate-900"
            aria-label={`${clubName} 홈으로 돌아가기`}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h2 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight">
            Notice Board
          </h2>
          <div className="flex w-10 items-center justify-end">
            {isAdmin ? (
              <button
                type="button"
                onClick={openCreateModal}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]"
                aria-label="공지 작성"
              >
                <span className="material-symbols-outlined">edit_square</span>
              </button>
            ) : (
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent text-slate-900"
                aria-label="검색"
              >
                <span className="material-symbols-outlined">search</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-28">
          <div className="px-4 py-4">
            <label className="flex w-full flex-col">
              <div className="flex h-12 w-full items-stretch rounded-xl bg-slate-100">
                <div className="flex items-center justify-center pl-4 text-slate-500">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="form-input flex w-full border-none bg-transparent px-3 text-base text-slate-900 placeholder:text-slate-500 focus:ring-0"
                  placeholder="Search announcements..."
                  type="text"
                  value={query}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => {
                      setQuery(nextValue);
                    });
                  }}
                />
              </div>
            </label>
          </div>

          <div className="mb-2 px-4">
            <div className="hide-scrollbar flex gap-6 overflow-x-auto border-b border-slate-200">
              {CATEGORIES.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        setActiveCategory(category.id);
                      });
                    }}
                    className={`flex shrink-0 flex-col items-center justify-center border-b-2 pb-3 pt-2 ${
                      isActive
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    <p className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>{category.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {items.map((notice) => (
              <Link
                key={notice.noticeId}
                href={`/clubs/${clubId}/board/${notice.noticeId}`}
                className="flex gap-4 bg-white px-4 py-5 transition-colors hover:bg-slate-50"
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <span className="material-symbols-outlined">
                    {CATEGORY_ICON[notice.categoryKey] ?? "campaign"}
                  </span>
                </div>
                <div className="min-w-0 flex flex-1 flex-col gap-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {notice.pinned ? (
                          <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                            Pin
                          </span>
                        ) : null}
                        <p className="truncate text-base font-bold leading-snug text-slate-900">
                          {notice.title}
                        </p>
                      </div>
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate-400">{notice.timeAgo}</span>
                  </div>
                  <p className="line-clamp-3 text-sm text-slate-600">{notice.summary}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex size-5 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)]/20">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                      </div>
                      <p className="font-semibold text-[var(--primary)]">{notice.authorDisplayName}</p>
                    </div>
                    {notice.scheduleAtLabel ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">
                        {notice.scheduleAtLabel}
                      </span>
                    ) : null}
                    {notice.locationLabel ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-600">
                        {notice.locationLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {loading && !initialLoaded ? (
            <div className="flex justify-center p-8 text-sm font-medium text-slate-500">Loading notices...</div>
          ) : null}

          {!loading && initialLoaded && items.length === 0 ? (
            <div className="flex justify-center p-8 text-sm font-medium text-slate-500">
              등록된 공지가 없습니다.
            </div>
          ) : null}

          {error ? (
            <div className="mx-4 mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : null}

          <div ref={setSentinelNode} className="h-16" />

          {loading && initialLoaded ? (
            <div className="flex justify-center pb-8 text-sm font-medium text-slate-500">
              Loading more...
            </div>
          ) : null}
        </main>

        {isAdmin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}
        <ClubBottomNav clubId={clubId} isAdmin={isAdmin} />

        <AnimatePresence>
          {showCreateModal ? (
            <RouteModal onDismiss={() => setShowCreateModal(false)} dismissOnBackdrop={false}>
              <ClubNoticeEditorClient
                clubId={clubId}
                presentation="modal"
                initialScheduleAt={createDefaults?.scheduleAt}
                initialScheduleEndAt={createDefaults?.scheduleEndAt}
                onRequestClose={() => setShowCreateModal(false)}
              />
            </RouteModal>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
