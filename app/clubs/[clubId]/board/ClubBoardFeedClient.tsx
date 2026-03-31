"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ItemReadStatusModal } from "@/app/components/ItemReadStatusModal";
import { RouteModal } from "@/app/components/RouteModal";
import {
  ClubNoticeDetailModal,
  ClubPollDetailModal,
  ClubScheduleEventDetailModal,
  ClubTournamentDetailModal,
} from "@/app/components/ClubDetailModals";
import {
  type BoardItemReadStatusResponse,
  type ClubBoardFeedItem,
  type TournamentSummary,
  deleteClubTournament,
  deleteClubNotice,
  deleteClubScheduleEvent,
  deleteClubScheduleVote,
  getClubBoardItemReadStatus,
  getClubNoticeFeed,
  type ClubNoticeFeedResponse,
  type ClubNoticeListItem,
  type ClubScheduleEventSummary,
  type ClubScheduleVoteSummary,
  recordClubBoardItemRead,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { getShareTargetBadges } from "@/app/lib/content-badge";
import { getVoteLifecycleLabel } from "@/app/lib/vote-status";
import { ClubNoticeEditorClient } from "./ClubNoticeEditorClient";
import { NoticeManageCard } from "./NoticeManageCard";
import { BoardScheduleManageCard } from "./BoardScheduleManageCard";
import { ClubBoardFeedLoadingShell } from "../ClubRouteLoadingShells";
import { ScheduleActionConfirmModal } from "../schedule/ScheduleActionConfirmModal";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import Image from "next/image";
import { ClubScheduleEditorClient } from "../schedule/ClubScheduleEditorClient";
import { ClubScheduleVoteEditorClient } from "../schedule/ClubScheduleVoteEditorClient";
import { PinnedBoardCarousel } from "./PinnedBoardCarousel";
import { BoardTournamentManageCard } from "./BoardTournamentManageCard";
import { ClubTournamentEditorClient } from "../more/tournaments/ClubTournamentEditorClient";

type CursorState = {
  boardItemId: number | null;
};

type ClubBoardFeedClientProps = {
  clubId: string;
};

type BoardReadStatusModalState = {
  title: string;
  status: BoardItemReadStatusResponse | null;
};

function isPinnedBoardItem(item: ClubBoardFeedItem) {
  return Boolean(
    (item.contentType === "NOTICE" && item.notice?.pinned)
      || (item.contentType === "SCHEDULE_EVENT" && item.event?.pinned)
      || (item.contentType === "SCHEDULE_VOTE" && item.vote?.pinned)
      || (item.contentType === "TOURNAMENT" && item.tournament?.pinned),
  );
}

function BoardAuthorMeta({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
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
  readCount,
  canEdit,
  canDelete,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
  onOpenReadStatus,
}: {
  vote: ClubScheduleVoteSummary;
  readCount: number;
  canEdit: boolean;
  canDelete: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenReadStatus?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const manageable = canEdit || canDelete;
  const shareBadges = getShareTargetBadges({
    postedToBoard: vote.postedToBoard,
    postedToCalendar: vote.postedToCalendar,
    includeBoard: true,
  });

  return (
    <div className="relative overflow-visible rounded-[8px] border border-slate-100 bg-white shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(eventKey) => {
          if (eventKey.key === "Enter" || eventKey.key === " ") {
            eventKey.preventDefault();
            onOpen();
          }
        }}
        className="block cursor-pointer px-4 py-4 text-left transition hover:bg-slate-50"
        aria-label={`${vote.title} 투표 자세히 보기`}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-bold uppercase text-violet-600">투표</span>
            {vote.pinned ? (
              <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-600">고정</span>
            ) : null}
            {shareBadges.map((shareBadge) => (
              <span
                key={shareBadge.label}
                className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${shareBadge.className}`}
              >
                {shareBadge.label}
              </span>
            ))}
          </div>
          <span className="shrink-0 text-xs text-slate-400">{getVoteLifecycleLabel(vote.voteStatus)}</span>
        </div>
        <h2 className="mb-2 line-clamp-1 text-base font-bold text-slate-900">{vote.title}</h2>
        <p className="line-clamp-2 text-sm leading-6 text-slate-500">
          {vote.votePeriodLabel}
          {vote.voteTimeLabel ? ` · ${vote.voteTimeLabel}` : ""}
          {vote.totalResponses > 0 ? ` · ${vote.totalResponses}명 참여` : ""}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <BoardAuthorMeta
              name={vote.authorDisplayName}
              avatarUrl={vote.authorAvatarThumbnailUrl ?? vote.authorAvatarImageUrl}
            />
            {onOpenReadStatus ? (
              <button
                type="button"
                onClick={(targetEvent) => {
                  targetEvent.stopPropagation();
                  onOpenReadStatus();
                }}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <span className="material-symbols-outlined text-[14px]">visibility</span>
                읽음 {readCount}명
              </button>
            ) : null}
          </div>
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
                    className="absolute right-0 top-10 z-30 w-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
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
      </div>
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
  const [detailTournamentId, setDetailTournamentId] = useState<string | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubNoticeListItem | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingVoteId, setEditingVoteId] = useState<string | null>(null);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<ClubScheduleEventSummary | null>(null);
  const [deleteVoteTarget, setDeleteVoteTarget] = useState<ClubScheduleVoteSummary | null>(null);
  const [deleteTournamentTarget, setDeleteTournamentTarget] = useState<TournamentSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [readStatusModal, setReadStatusModal] = useState<BoardReadStatusModalState | null>(null);
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
      setDetailTournamentId(null);
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

  const handleDeleteTournament = async () => {
    if (!deleteTournamentTarget) {
      return;
    }
    setDeleting(true);
    const result = await deleteClubTournament(clubId, deleteTournamentTarget.tournamentRecordId);
    setDeleting(false);
    if (!result.ok) {
      return;
    }
    setDeleteTournamentTarget(null);
    setActiveActionKey(null);
    setReloadKey((current) => current + 1);
  };

  const patchBoardItemReadCount = (boardItemId: number, readCount: number) => {
    startTransition(() => {
      setItems((current) => current.map((item) => (
        item.boardItemId === boardItemId
          ? { ...item, readCount }
          : item
      )));
    });
  };

  const recordBoardItemRead = async (boardItemId: number) => {
    const result = await recordClubBoardItemRead(clubId, boardItemId);
    if (!result.ok || !result.data) {
      return;
    }
    patchBoardItemReadCount(boardItemId, result.data.readCount);
  };

  const openBoardItemDetail = (item: ClubBoardFeedItem) => {
    setActiveActionKey(null);
    void recordBoardItemRead(item.boardItemId);

    if (item.contentType === "NOTICE" && item.notice) {
      setDetailNoticeId(String(item.notice.noticeId));
      return;
    }
    if (item.contentType === "SCHEDULE_EVENT" && item.event) {
      setDetailEventId(String(item.event.eventId));
      return;
    }
    if (item.contentType === "SCHEDULE_VOTE" && item.vote) {
      setDetailVoteId(String(item.vote.voteId));
      return;
    }
    if (item.contentType === "TOURNAMENT" && item.tournament) {
      setDetailTournamentId(String(item.tournament.tournamentRecordId));
    }
  };

  const openBoardReadStatus = async (boardItemId: number, title: string) => {
    setActiveActionKey(null);
    const result = await getClubBoardItemReadStatus(clubId, boardItemId);
    if (!result.ok || !result.data) {
      setError(result.message ?? "읽음 현황을 불러오지 못했습니다.");
      return;
    }
    setReadStatusModal({ title, status: result.data });
  };

  if (!initialLoaded && !error) {
    return <ClubBoardFeedLoadingShell />;
  }

  const pinnedItems = items.filter(isPinnedBoardItem);
  const visibleItems = items;

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="relative mx-auto flex min-h-full max-w-md flex-col bg-white">
        <ClubPageHeader title="게시판" subtitle={clubName} icon="campaign" />

        <main className="semo-nav-bottom-space flex-1">
          <div className="space-y-6 px-4 pt-6">
            {pinnedOnly ? (
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <span
                      className="material-symbols-outlined text-red-500 text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20" }}
                    >
                      push_pin
                    </span>
                    중요 핀 게시물
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPinnedOnly(false)}
                    className="text-xs font-medium text-slate-400 transition hover:text-slate-600"
                  >
                    전체 게시글
                  </button>
                </div>
              </section>
            ) : pinnedItems.length > 0 ? (
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <span
                      className="material-symbols-outlined text-red-500 text-[20px]"
                      style={{ fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20" }}
                    >
                      push_pin
                    </span>
                    중요 고정 게시물
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPinnedOnly(true)}
                    className="text-xs font-medium text-slate-400 transition hover:text-slate-600"
                  >
                    전체보기
                  </button>
                </div>
                <PinnedBoardCarousel
                  items={pinnedItems}
                  onOpenItem={openBoardItemDetail}
                />
              </section>
            ) : null}

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900">{pinnedOnly ? "중요 핀 게시물" : "최근 게시글"}</h2>
              </div>
              <div className="flex flex-col gap-4">
            {visibleItems.map((item, index) => (
              <motion.article
                key={`${item.contentType}-${item.boardItemId}`}
                {...staggeredFadeUpMotion(index, reduceMotion)}
                className={
                  activeActionKey ===
                  (item.contentType === "NOTICE" && item.notice
                    ? `notice-${item.notice.noticeId}`
                    : item.contentType === "SCHEDULE_EVENT" && item.event
                      ? `event-${item.event.eventId}`
                    : item.contentType === "SCHEDULE_VOTE" && item.vote
                        ? `vote-${item.vote.voteId}`
                        : item.contentType === "TOURNAMENT" && item.tournament
                          ? `tournament-${item.tournament.tournamentRecordId}`
                        : "")
                    ? "relative z-20"
                    : "relative"
                }
              >
                {item.contentType === "NOTICE" && item.notice ? (
                  <NoticeManageCard
                    notice={item.notice}
                    readCount={item.readCount}
                    canEdit={isAdmin || item.notice.canEdit}
                    canDelete={isAdmin || item.notice.canDelete}
                    onOpenReadStatus={() => openBoardReadStatus(item.boardItemId, item.notice!.title)}
                    showBoardShareBadge
                    open={activeActionKey === `notice-${item.notice.noticeId}`}
                    onOpenChange={(nextOpen) => {
                      setActiveActionKey(nextOpen ? `notice-${item.notice!.noticeId}` : null);
                    }}
                    onOpen={() => {
                      openBoardItemDetail(item);
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
                    readCount={item.readCount}
                    canEdit={isAdmin || item.event.canEdit}
                    canDelete={isAdmin || item.event.canDelete}
                    onOpenReadStatus={() => openBoardReadStatus(item.boardItemId, item.event!.title)}
                    showBoardShareBadge
                    open={activeActionKey === `event-${item.event.eventId}`}
                    onOpenChange={(nextOpen) => {
                      setActiveActionKey(nextOpen ? `event-${item.event!.eventId}` : null);
                    }}
                    onOpen={() => {
                      openBoardItemDetail(item);
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
                    readCount={item.readCount}
                    canEdit={isAdmin || item.vote.canEdit}
                    canDelete={isAdmin || item.vote.canDelete}
                    onOpenReadStatus={() => openBoardReadStatus(item.boardItemId, item.vote!.title)}
                    open={activeActionKey === `vote-${item.vote.voteId}`}
                    onOpenChange={(nextOpen) => {
                      setActiveActionKey(nextOpen ? `vote-${item.vote!.voteId}` : null);
                    }}
                    onOpen={() => {
                      openBoardItemDetail(item);
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
                {item.contentType === "TOURNAMENT" && item.tournament ? (
                  <BoardTournamentManageCard
                    tournament={item.tournament}
                    readCount={item.readCount}
                    canEdit={isAdmin || item.tournament.canEdit}
                    canDelete={isAdmin || item.tournament.canDelete}
                    onOpenReadStatus={() => openBoardReadStatus(item.boardItemId, item.tournament!.title)}
                    showBoardShareBadge
                    open={activeActionKey === `tournament-${item.tournament.tournamentRecordId}`}
                    onOpenChange={(nextOpen) => {
                      setActiveActionKey(nextOpen ? `tournament-${item.tournament!.tournamentRecordId}` : null);
                    }}
                    onOpen={() => {
                      openBoardItemDetail(item);
                    }}
                    onEdit={() => {
                      setActiveActionKey(null);
                      setDetailTournamentId(null);
                      setEditingTournamentId(String(item.tournament!.tournamentRecordId));
                    }}
                    onDelete={() => {
                      setActiveActionKey(null);
                      setDetailTournamentId(null);
                      setDeleteTournamentTarget(item.tournament!);
                    }}
                  />
                ) : null}
              </motion.article>
            ))}
              </div>
            </section>
          </div>

          {!loading && initialLoaded && visibleItems.length === 0 ? (
            <motion.div
              className="flex justify-center p-8 text-sm font-medium text-slate-500"
              {...staggeredFadeUpMotion(2, reduceMotion)}
            >
              {pinnedOnly ? "핀 고정 게시물이 없습니다." : "등록된 게시판 항목이 없습니다."}
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
          {detailTournamentId ? (
            <ClubTournamentDetailModal
              clubId={clubId}
              tournamentRecordId={detailTournamentId}
              onRequestClose={() => setDetailTournamentId(null)}
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
          {editingTournamentId ? (
            <RouteModal onDismiss={() => setEditingTournamentId(null)} dismissOnBackdrop={false}>
              <ClubTournamentEditorClient
                clubId={clubId}
                tournamentRecordId={editingTournamentId}
                presentation="modal"
                onRequestClose={() => setEditingTournamentId(null)}
                onSaved={(savedTournamentId) => {
                  setEditingTournamentId(null);
                  setActiveActionKey(null);
                  setReloadKey((current) => current + 1);
                  setDetailTournamentId(String(savedTournamentId));
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
          {deleteTournamentTarget ? (
            <ScheduleActionConfirmModal
              title="대회를 삭제할까요?"
              description={`"${deleteTournamentTarget.title}" 대회는 삭제 후 복구할 수 없습니다.`}
              confirmLabel="대회 삭제"
              busyLabel="삭제 중..."
              busy={deleting}
              onCancel={() => {
                if (!deleting) {
                  setDeleteTournamentTarget(null);
                }
              }}
              onConfirm={handleDeleteTournament}
            />
          ) : null}
          {readStatusModal ? (
            <ItemReadStatusModal
              title={readStatusModal.title}
              readCount={readStatusModal.status?.readCount ?? null}
              readers={readStatusModal.status?.readers ?? []}
              onClose={() => setReadStatusModal(null)}
            />
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
