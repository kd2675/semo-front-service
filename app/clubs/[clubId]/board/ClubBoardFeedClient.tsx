"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { RouteModal } from "@/app/components/RouteModal";
import { ClubNoticeDetailModal, ClubPollDetailModal, ClubScheduleEventDetailModal } from "@/app/components/ClubDetailModals";
import {
  deleteClubNotice,
  getClubNoticeFeed,
  type ClubNoticeFeedResponse,
  type ClubNoticeListItem,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { ClubNoticeEditorClient } from "./ClubNoticeEditorClient";
import { NoticeManageCard } from "./NoticeManageCard";
import { ClubBoardFeedLoadingShell } from "../ClubRouteLoadingShells";
import { ScheduleActionConfirmModal } from "../schedule/ScheduleActionConfirmModal";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";

type CursorState = {
  publishedAt: string | null;
  noticeId: number | null;
};

type ClubBoardFeedClientProps = {
  clubId: string;
};

export function ClubBoardFeedClient({ clubId }: ClubBoardFeedClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [items, setItems] = useState<ClubNoticeListItem[]>([]);
  const [clubName, setClubName] = useState("Notice Board");
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailNoticeId, setDetailNoticeId] = useState<string | null>(null);
  const [sharedEventDetailId, setSharedEventDetailId] = useState<string | null>(null);
  const [sharedVoteDetailId, setSharedVoteDetailId] = useState<string | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubNoticeListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeActionNoticeId, setActiveActionNoticeId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [cursor, setCursor] = useState<CursorState>({ publishedAt: null, noticeId: null });
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
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
      setSharedEventDetailId(null);
      setSharedVoteDetailId(null);
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const result = await getClubNoticeFeed(clubId, {
      pinnedOnly,
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
  }, [clubId, pinnedOnly, reloadKey]);

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

  const handleModalSaved = (savedNoticeId: number) => {
    setEditingNoticeId(null);
    setActiveActionNoticeId(null);
    setReloadKey((current) => current + 1);
    setDetailNoticeId(String(savedNoticeId));
  };

  if (!initialLoaded && !error) {
    return <ClubBoardFeedLoadingShell />;
  }

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-full max-w-md flex-col bg-white">
        <ClubPageHeader title="공지 게시판" subtitle={clubName} icon="campaign" />

        <main className="semo-nav-bottom-space flex-1">
          <div className="px-4 pt-4">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                aria-pressed={!pinnedOnly}
                onClick={() => setPinnedOnly(false)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  pinnedOnly ? "text-slate-500 hover:text-slate-700" : "bg-[#135bec] text-white"
                }`}
              >
                전체
              </button>
              <button
                type="button"
                aria-pressed={pinnedOnly}
                onClick={() => setPinnedOnly(true)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  pinnedOnly ? "bg-[#135bec] text-white" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                핀 고정
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-4">
            {items.map((notice, index) => (
              <motion.article key={notice.noticeId} {...staggeredFadeUpMotion(index, reduceMotion)}>
                <NoticeManageCard
                  notice={notice}
                  manageable={isAdmin || notice.canManage}
                  open={activeActionNoticeId === notice.noticeId}
                  onOpenChange={(nextOpen) => {
                    setActiveActionNoticeId(nextOpen ? notice.noticeId : null);
                  }}
                  onOpen={() => {
                    setActiveActionNoticeId(null);
                    if (notice.linkedTargetType === "POLL" && notice.linkedTargetId != null) {
                      setSharedVoteDetailId(String(notice.linkedTargetId));
                      return;
                    }
                    if (notice.linkedTargetType === "SCHEDULE_EVENT" && notice.linkedTargetId != null) {
                      setSharedEventDetailId(String(notice.linkedTargetId));
                      return;
                    }
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
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              {pinnedOnly ? "핀 고정 공지가 없습니다." : "등록된 공지가 없습니다."}
            </motion.div>
          ) : null}

          {error ? (
            <motion.div
              className="mx-4 mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600"
              {...staggeredFadeUpMotion(3, reduceMotion)}
            >
              {error}
            </motion.div>
          ) : null}

          <div ref={setSentinelNode} className="h-px" aria-hidden="true" />

          {loading && initialLoaded ? (
            <div className="space-y-4 px-4 pb-8">
              {Array.from({ length: 2 }, (_, index) => (
                <motion.article
                  key={`append-shell-${index}`}
                  className="overflow-hidden rounded-[8px] border border-slate-100 bg-white shadow-sm"
                  {...staggeredFadeUpMotion(index + 4, reduceMotion)}
                >
                  <div className="h-40 w-full bg-slate-100" />
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="h-5 w-20 rounded-full bg-[var(--primary)]/10" />
                      <div className="h-4 w-20 rounded-full bg-slate-200" />
                    </div>
                    <div className="h-5 w-4/5 rounded-full bg-slate-200" />
                    <div className="h-4 w-full rounded-full bg-slate-100" />
                    <div className="h-4 w-2/3 rounded-full bg-slate-100" />
                  </div>
                </motion.article>
              ))}
            </div>
          ) : null}
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
          {sharedEventDetailId ? (
            <ClubScheduleEventDetailModal
              clubId={clubId}
              eventId={sharedEventDetailId}
              onRequestClose={() => setSharedEventDetailId(null)}
            />
          ) : null}
          {sharedVoteDetailId ? (
            <ClubPollDetailModal
              clubId={clubId}
              voteId={sharedVoteDetailId}
              onRequestClose={() => setSharedVoteDetailId(null)}
            />
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
                basePath={`/clubs/${clubId}/board`}
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
