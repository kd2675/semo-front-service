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
  type ClubBoardFeedItem,
  deleteClubNotice,
  deleteClubScheduleEvent,
  deleteClubScheduleVote,
  getClubNoticeFeed,
  type ClubNoticeFeedResponse,
  type ClubNoticeListItem,
  type ClubScheduleEventSummary,
  type ClubScheduleVoteSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { ClubNoticeEditorClient } from "./ClubNoticeEditorClient";
import { NoticeManageCard } from "./NoticeManageCard";
import { BoardScheduleManageCard } from "./BoardScheduleManageCard";
import { ClubBoardFeedLoadingShell } from "../ClubRouteLoadingShells";
import { ScheduleActionConfirmModal } from "../schedule/ScheduleActionConfirmModal";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import Image from "next/image";
import { ClubScheduleEditorClient } from "../schedule/ClubScheduleEditorClient";
import { ClubScheduleVoteEditorClient } from "../schedule/ClubScheduleVoteEditorClient";

type CursorState = {
  boardItemId: number | null;
};

type ClubBoardFeedClientProps = {
  clubId: string;
};

function getSharedVoteStatusLabel(vote: ClubScheduleVoteSummary) {
  if (vote.voteStatus === "CLOSED") {
    return "종료";
  }
  if (vote.voteStatus === "WAITING") {
    return "예정";
  }
  return vote.mySelectedOptionId ? "참여 완료" : "진행 중";
}

function BoardAuthorMeta({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="mb-3 flex min-w-0 items-center gap-3">
      {avatarUrl ? (
        <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-100">
          <Image src={avatarUrl} alt={name} fill sizes="32px" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
          {name.slice(0, 1)}
        </div>
      )}
      <p className="min-w-0 truncate text-sm font-semibold text-slate-600">{name}</p>
    </div>
  );
}

function BoardVoteCard({
  vote,
  canEdit,
  canDelete,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
}: {
  vote: ClubScheduleVoteSummary;
  canEdit: boolean;
  canDelete: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const manageable = canEdit || canDelete;

  return (
    <div className="relative overflow-visible rounded-[8px] border border-slate-100 bg-white shadow-sm">
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pb-2 pt-4">
        <BoardAuthorMeta
          name={vote.authorDisplayName}
          avatarUrl={vote.authorAvatarThumbnailUrl ?? vote.authorAvatarImageUrl}
        />
        {manageable ? (
          <div className="relative">
            <button
              type="button"
              aria-label={`${vote.title} 관리 메뉴`}
              onClick={(targetEvent) => {
                targetEvent.stopPropagation();
                onOpenChange(!open);
              }}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  initial={false}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: reduceMotion ? 0.1 : 0.16, ease: "easeOut" }}
                  className="absolute right-0 top-10 z-20 w-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
                >
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={(targetEvent) => {
                        targetEvent.stopPropagation();
                        onOpenChange(false);
                        onEdit();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      수정
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={(targetEvent) => {
                        targetEvent.stopPropagation();
                        onOpenChange(false);
                        onDelete();
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 ${
                        canEdit ? "border-t border-slate-100" : ""
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      삭제
                    </button>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
      <div className="mx-4 border-t border-slate-100" aria-hidden="true" />
      <button
        type="button"
        onClick={onOpen}
        className="block w-full px-4 pb-4 pt-1 text-left transition hover:bg-slate-50"
        aria-label={`${vote.title} 투표 자세히 보기`}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-bold uppercase text-violet-600">투표</span>
          <span className="shrink-0 text-xs text-slate-400">{getSharedVoteStatusLabel(vote)}</span>
        </div>
        <h2 className="mb-2 line-clamp-1 text-base font-bold text-slate-900">{vote.title}</h2>
        <p className="line-clamp-2 text-sm leading-6 text-slate-500">
          {vote.votePeriodLabel}
          {vote.voteTimeLabel ? ` • ${vote.voteTimeLabel}` : ""}
        </p>
      </button>
    </div>
  );
}

export function ClubBoardFeedClient({ clubId }: ClubBoardFeedClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [items, setItems] = useState<ClubBoardFeedItem[]>([]);
  const [clubName, setClubName] = useState("Notice Board");
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailNoticeId, setDetailNoticeId] = useState<string | null>(null);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [detailVoteId, setDetailVoteId] = useState<string | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubNoticeListItem | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingVoteId, setEditingVoteId] = useState<string | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<ClubScheduleEventSummary | null>(null);
  const [deleteVoteTarget, setDeleteVoteTarget] = useState<ClubScheduleVoteSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [cursor, setCursor] = useState<CursorState>({ boardItemId: null });
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  const loadFeed = useEffectEvent(async (mode: "reset" | "append") => {
    if (loadingRef.current) {
      return;
    }

    if (mode === "reset") {
      setItems([]);
      setHasNext(false);
      setCursor({ boardItemId: null });
      setInitialLoaded(false);
      setActiveActionKey(null);
      setDetailNoticeId(null);
      setDetailEventId(null);
      setDetailVoteId(null);
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    const result = await getClubNoticeFeed(clubId, {
      pinnedOnly,
      cursorBoardItemId: mode === "append" ? cursor.boardItemId : null,
      size: 10,
    });

    loadingRef.current = false;
    setLoading(false);
    setInitialLoaded(true);

    if (!result.ok || !result.data) {
      setError(result.message ?? "게시판 피드를 불러오지 못했습니다.");
      return;
    }

    const payload: ClubNoticeFeedResponse = result.data;
    setClubName(payload.clubName);
    setIsAdmin(payload.admin);
    setHasNext(payload.hasNext);
    setCursor({
      boardItemId: payload.nextCursorBoardItemId,
    });
    setItems((current) => (mode === "append" ? [...current, ...payload.items] : payload.items));
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
    setActiveActionKey(null);
    setReloadKey((current) => current + 1);
  };

  const handleModalSaved = (savedNoticeId: number) => {
    setEditingNoticeId(null);
    setActiveActionKey(null);
    setReloadKey((current) => current + 1);
    setDetailNoticeId(String(savedNoticeId));
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) {
      return;
    }
    setDeleting(true);
    setError(null);
    const result = await deleteClubScheduleEvent(clubId, deleteEventTarget.eventId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message ?? "일정 삭제에 실패했습니다.");
      return;
    }
    setDeleteEventTarget(null);
    setActiveActionKey(null);
    setReloadKey((current) => current + 1);
  };

  const handleDeleteVote = async () => {
    if (!deleteVoteTarget) {
      return;
    }
    setDeleting(true);
    setError(null);
    const result = await deleteClubScheduleVote(clubId, deleteVoteTarget.voteId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message ?? "투표 삭제에 실패했습니다.");
      return;
    }
    setDeleteVoteTarget(null);
    setActiveActionKey(null);
    setReloadKey((current) => current + 1);
  };

  if (!initialLoaded && !error) {
    return <ClubBoardFeedLoadingShell />;
  }

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-full max-w-md flex-col bg-white">
        <ClubPageHeader title="게시판" subtitle={clubName} icon="campaign" />

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
            {items.map((item, index) => (
              <motion.article
                key={`${item.contentType}-${item.boardItemId}`}
                {...staggeredFadeUpMotion(index, reduceMotion)}
              >
                {item.contentType === "NOTICE" && item.notice ? (
                  <NoticeManageCard
                    notice={item.notice}
                    canEdit={isAdmin || item.notice.canEdit}
                    canDelete={isAdmin || item.notice.canDelete}
                    open={activeActionKey === `notice-${item.notice.noticeId}`}
                    onOpenChange={(nextOpen) => {
                      setActiveActionKey(nextOpen ? `notice-${item.notice!.noticeId}` : null);
                    }}
                    onOpen={() => {
                      setActiveActionKey(null);
                      setDetailNoticeId(String(item.notice!.noticeId));
                    }}
                    onEdit={() => {
                      setActiveActionKey(null);
                      setDetailNoticeId(null);
                      setEditingNoticeId(String(item.notice!.noticeId));
                    }}
                    onDelete={() => {
                      setActiveActionKey(null);
                      setDetailNoticeId(null);
                      setDeleteTarget(item.notice!);
                    }}
                  />
                ) : null}
                {item.contentType === "SCHEDULE_EVENT" && item.event ? (
                  <BoardScheduleManageCard
                    event={item.event}
                    canEdit={isAdmin || item.event.canEdit}
                    canDelete={isAdmin || item.event.canDelete}
                    open={activeActionKey === `event-${item.event.eventId}`}
                    onOpenChange={(nextOpen) => {
                      setActiveActionKey(nextOpen ? `event-${item.event!.eventId}` : null);
                    }}
                    onOpen={() => {
                      setActiveActionKey(null);
                      setDetailEventId(String(item.event!.eventId));
                    }}
                    onEdit={() => {
                      setActiveActionKey(null);
                      setDetailEventId(null);
                      setEditingEventId(String(item.event!.eventId));
                    }}
                    onDelete={() => {
                      setActiveActionKey(null);
                      setDetailEventId(null);
                      setDeleteEventTarget(item.event!);
                    }}
                  />
                ) : null}
                {item.contentType === "SCHEDULE_VOTE" && item.vote ? (
                  <BoardVoteCard
                    vote={item.vote}
                    canEdit={isAdmin || item.vote.canEdit}
                    canDelete={isAdmin || item.vote.canDelete}
                    open={activeActionKey === `vote-${item.vote.voteId}`}
                    onOpenChange={(nextOpen) => {
                      setActiveActionKey(nextOpen ? `vote-${item.vote!.voteId}` : null);
                    }}
                    onOpen={() => {
                      setActiveActionKey(null);
                      setDetailVoteId(String(item.vote!.voteId));
                    }}
                    onEdit={() => {
                      setActiveActionKey(null);
                      setDetailVoteId(null);
                      setEditingVoteId(String(item.vote!.voteId));
                    }}
                    onDelete={() => {
                      setActiveActionKey(null);
                      setDetailVoteId(null);
                      setDeleteVoteTarget(item.vote!);
                    }}
                  />
                ) : null}
              </motion.article>
            ))}
          </div>

          {!loading && initialLoaded && items.length === 0 ? (
            <motion.div
              className="flex justify-center p-8 text-sm font-medium text-slate-500"
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              {pinnedOnly ? "핀 고정 공지가 없습니다." : "등록된 게시판 항목이 없습니다."}
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
          {detailEventId ? (
            <ClubScheduleEventDetailModal
              clubId={clubId}
              eventId={detailEventId}
              onRequestClose={() => setDetailEventId(null)}
            />
          ) : null}
          {detailVoteId ? (
            <ClubPollDetailModal
              clubId={clubId}
              voteId={detailVoteId}
              onRequestClose={() => setDetailVoteId(null)}
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
                  setActiveActionKey(null);
                  setReloadKey((current) => current + 1);
                }}
              />
            </RouteModal>
          ) : null}
          {editingEventId ? (
            <RouteModal onDismiss={() => setEditingEventId(null)} dismissOnBackdrop={false}>
              <ClubScheduleEditorClient
                clubId={clubId}
                eventId={editingEventId}
                clubName={clubName}
                presentation="modal"
                onRequestClose={() => setEditingEventId(null)}
                onSaved={(savedEventId) => {
                  setEditingEventId(null);
                  setActiveActionKey(null);
                  setReloadKey((current) => current + 1);
                  setDetailEventId(String(savedEventId));
                }}
                onDeleted={() => {
                  setEditingEventId(null);
                  setActiveActionKey(null);
                  setReloadKey((current) => current + 1);
                }}
              />
            </RouteModal>
          ) : null}
          {editingVoteId ? (
            <RouteModal onDismiss={() => setEditingVoteId(null)} dismissOnBackdrop={false}>
              <ClubScheduleVoteEditorClient
                clubId={clubId}
                voteId={editingVoteId}
                clubName={clubName}
                presentation="modal"
                basePath={`/clubs/${clubId}/more/polls`}
                onRequestClose={() => setEditingVoteId(null)}
                onSaved={(savedVoteId) => {
                  setEditingVoteId(null);
                  setActiveActionKey(null);
                  setReloadKey((current) => current + 1);
                  setDetailVoteId(String(savedVoteId));
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
          {deleteEventTarget ? (
            <ScheduleActionConfirmModal
              title="일정을 삭제할까요?"
              description={`"${deleteEventTarget.title}" 일정은 삭제 후 복구할 수 없습니다.`}
              confirmLabel="일정 삭제"
              busyLabel="삭제 중..."
              busy={deleting}
              onCancel={() => {
                if (!deleting) {
                  setDeleteEventTarget(null);
                }
              }}
              onConfirm={handleDeleteEvent}
            />
          ) : null}
          {deleteVoteTarget ? (
            <ScheduleActionConfirmModal
              title="투표를 삭제할까요?"
              description={`"${deleteVoteTarget.title}" 투표는 삭제 후 복구할 수 없습니다.`}
              confirmLabel="투표 삭제"
              busyLabel="삭제 중..."
              busy={deleting}
              onCancel={() => {
                if (!deleting) {
                  setDeleteVoteTarget(null);
                }
              }}
              onConfirm={handleDeleteVote}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
