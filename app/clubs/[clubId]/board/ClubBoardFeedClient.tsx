"use client";

import { RouterLink } from "@/app/components/RouterLink";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
  deleteClubNotice,
  getClubNoticeFeed,
  getNoticeCategoryOptions,
  type ClubNoticeFeedResponse,
  type ClubNoticeListItem,
  type NoticeCategoryOption,
  type NoticeFeedCategory,
} from "@/app/lib/clubs";
import { toDateTimeLocalString } from "@/app/lib/date-time";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { ClubNoticeEditorClient } from "./ClubNoticeEditorClient";
import { NoticeManageCard } from "./NoticeManageCard";
import { ClubBoardFeedLoadingShell } from "../ClubRouteLoadingShells";
import { ScheduleActionConfirmModal } from "../schedule/ScheduleActionConfirmModal";
import { ClubNoticeDetailClient } from "./[noticeId]/ClubNoticeDetailClient";

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
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<NoticeFeedCategory>("all");
  const [categories, setCategories] = useState<NoticeCategoryOption[]>([]);
  const [items, setItems] = useState<ClubNoticeListItem[]>([]);
  const [clubName, setClubName] = useState("Notice Board");
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailNoticeId, setDetailNoticeId] = useState<string | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubNoticeListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeActionNoticeId, setActiveActionNoticeId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
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
      setActiveActionNoticeId(null);
      setDetailNoticeId(null);
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
  }, [clubId, activeCategory, deferredQuery, reloadKey]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const result = await getNoticeCategoryOptions(clubId);
      if (cancelled || !result.ok || !result.data) {
        return;
      }
      setCategories(result.data);
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId]);

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
    setActiveActionNoticeId(null);
    setShowCreateModal(true);
  };

  const handleDeleteNotice = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    setError(null);
    const result = await deleteClubNotice(clubId, deleteTarget.noticeId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message ?? "공지 삭제에 실패했습니다.");
      return;
    }
    setDeleteTarget(null);
    setActiveActionNoticeId(null);
    setReloadKey((current) => current + 1);
  };

  const handleModalSaved = () => {
    setShowCreateModal(false);
    setDetailNoticeId(null);
    setEditingNoticeId(null);
    setCreateDefaults(null);
    setActiveActionNoticeId(null);
    setReloadKey((current) => current + 1);
  };

  if (!initialLoaded && !error) {
    return <ClubBoardFeedLoadingShell />;
  }

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col overflow-x-hidden bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-4">
          <RouterLink
            href={`/clubs/${clubId}`}
            className="flex size-10 items-center justify-start text-slate-900"
            aria-label={`${clubName} 홈으로 돌아가기`}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </RouterLink>
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

        <main className="flex-1 pb-28">
          <motion.div className="px-4 py-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
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
          </motion.div>

          <motion.div className="mb-2 px-4" {...staggeredFadeUpMotion(1, reduceMotion)}>
            <div className="hide-scrollbar flex gap-6 overflow-x-auto border-b border-slate-200">
              {[{ categoryKey: "all", displayName: "All Posts", iconName: "apps", accentTone: "blue" }, ...categories].map((category) => {
                const isActive = activeCategory === category.categoryKey;
                return (
                  <button
                    key={category.categoryKey}
                    type="button"
                    onClick={() => {
                      startTransition(() => {
                        setActiveCategory(category.categoryKey);
                      });
                    }}
                    className={`flex shrink-0 flex-col items-center justify-center border-b-2 pb-3 pt-2 ${
                      isActive
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-slate-500"
                    }`}
                  >
                    <p className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>{category.displayName}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <div className="flex flex-col divide-y divide-slate-100">
            {items.map((notice, index) => (
              <motion.article key={notice.noticeId} {...staggeredFadeUpMotion(index + 2, reduceMotion)}>
                <NoticeManageCard
                  notice={notice}
                  manageable={isAdmin || notice.canManage}
                  open={activeActionNoticeId === notice.noticeId}
                  onOpenChange={(nextOpen) => {
                    setActiveActionNoticeId(nextOpen ? notice.noticeId : null);
                  }}
                  onOpen={() => {
                    setActiveActionNoticeId(null);
                    setDetailNoticeId(String(notice.noticeId));
                  }}
                  onEdit={() => {
                    setActiveActionNoticeId(null);
                    setDetailNoticeId(null);
                    setEditingNoticeId(String(notice.noticeId));
                  }}
                  onDelete={() => {
                    setActiveActionNoticeId(null);
                    setDetailNoticeId(null);
                    setDeleteTarget(notice);
                  }}
                />
              </motion.article>
            ))}
          </div>

          {!loading && initialLoaded && items.length === 0 ? (
            <motion.div
              className="flex justify-center p-8 text-sm font-medium text-slate-500"
              {...staggeredFadeUpMotion(4, reduceMotion)}
            >
              등록된 공지가 없습니다.
            </motion.div>
          ) : null}

          {error ? (
            <motion.div
              className="mx-4 mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
              {...staggeredFadeUpMotion(5, reduceMotion)}
            >
              {error}
            </motion.div>
          ) : null}

          <div ref={setSentinelNode} className="h-16" />

          {loading && initialLoaded ? (
            <div className="space-y-3 px-4 pb-8">
              {Array.from({ length: 2 }, (_, index) => (
                <motion.article
                  key={`append-shell-${index}`}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-5"
                  {...staggeredFadeUpMotion(index + 6, reduceMotion)}
                >
                  <div className="size-12 rounded-xl bg-[var(--primary)]/10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-10 rounded-full bg-[var(--primary)]/10" />
                      <div className="h-4 w-24 rounded-full bg-slate-200" />
                    </div>
                    <div className="mt-3 h-4 w-full rounded-full bg-slate-200" />
                    <div className="mt-2 h-4 w-2/3 rounded-full bg-slate-100" />
                  </div>
                </motion.article>
              ))}
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
                onSaved={handleModalSaved}
              />
            </RouteModal>
          ) : null}
          {detailNoticeId ? (
            <RouteModal
              onDismiss={() => {
                setDetailNoticeId(null);
              }}
            >
              <ClubNoticeDetailClient
                clubId={clubId}
                noticeId={detailNoticeId}
                presentation="modal"
                onRequestClose={() => setDetailNoticeId(null)}
              />
            </RouteModal>
          ) : null}
          {editingNoticeId ? (
            <RouteModal
              onDismiss={() => {
                setEditingNoticeId(null);
              }}
              dismissOnBackdrop={false}
            >
              <ClubNoticeEditorClient
                clubId={clubId}
                noticeId={editingNoticeId}
                presentation="modal"
                onRequestClose={() => setEditingNoticeId(null)}
                onSaved={handleModalSaved}
                onDeleted={() => {
                  setEditingNoticeId(null);
                  setActiveActionNoticeId(null);
                  setReloadKey((current) => current + 1);
                }}
              />
            </RouteModal>
          ) : null}
          {deleteTarget ? (
            <ScheduleActionConfirmModal
              title="공지를 삭제할까요?"
              description={`"${deleteTarget.title}" 공지는 삭제 후 복구할 수 없습니다.`}
              confirmLabel="공지 삭제"
              busyLabel="삭제 중..."
              busy={deleting}
              onCancel={() => {
                if (!deleting) {
                  setDeleteTarget(null);
                }
              }}
              onConfirm={handleDeleteNotice}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
