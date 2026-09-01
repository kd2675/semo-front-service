"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
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
  type ClubNoticeFeedResponse,
  type ClubNoticeListItem,
  type ClubScheduleEventSummary,
  type ClubScheduleVoteSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { invalidateClubQueries } from "@/app/lib/react-query/common";
import {
  boardReadStatusQueryOptions,
  noticeFeedQueryOptions,
} from "@/app/lib/react-query/board/queries";
import {
  deleteNoticeMutationOptions,
  recordBoardItemReadMutationOptions,
} from "@/app/lib/react-query/board/mutations";
import {
  deleteScheduleEventMutationOptions,
  deleteScheduleVoteMutationOptions,
} from "@/app/lib/react-query/schedule/mutations";
import { deleteTournamentMutationOptions } from "@/app/lib/react-query/tournaments/mutations";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";

import { ClubNoticeEditorClient } from "./ClubNoticeEditorClient";
import { NoticeManageCard } from "../components/NoticeManageCard";
import { BoardScheduleManageCard } from "../components/BoardScheduleManageCard";
import { ClubBoardFeedLoadingShell } from "../../ClubRouteLoadingShells";
import { ScheduleActionConfirmModal } from "../../schedule/modals/ScheduleActionConfirmModal";
import { ClubScheduleEditorClient } from "../../schedule/clients/ClubScheduleEditorClient";
import { ClubScheduleVoteEditorClient } from "../../schedule/clients/ClubScheduleVoteEditorClient";
import { PinnedBoardCarousel } from "../components/PinnedBoardCarousel";
import { BoardTournamentManageCard } from "../components/BoardTournamentManageCard";
import { BoardVoteCard } from "../components/BoardVoteCard";
import { ClubTournamentEditorClient } from "../../more/tournaments/clients/ClubTournamentEditorClient";

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

type BoardComposer = "chooser" | "notice" | "event" | "poll" | "tournament";

type BoardCreatePermissions = {
  notice: boolean;
  event: boolean;
  poll: boolean;
  tournament: boolean;
};

function isPinnedBoardItem(item: ClubBoardFeedItem) {
  return Boolean(
    (item.contentType === "NOTICE" && item.notice?.pinned)
      || (item.contentType === "SCHEDULE_EVENT" && item.event?.pinned)
      || (item.contentType === "SCHEDULE_VOTE" && item.vote?.pinned)
      || (item.contentType === "TOURNAMENT" && item.tournament?.pinned),
  );
}

export function ClubBoardFeedClient({ clubId }: ClubBoardFeedClientProps) {
  const queryClient = useQueryClient();
  const reduceMotion = useHydrationSafeReducedMotion();
  const [items, setItems] = useState<ClubBoardFeedItem[]>([]);
  const [clubName, setClubName] = useState("게시판");
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
  const [composer, setComposer] = useState<BoardComposer | null>(null);
  const [createPermissions, setCreatePermissions] = useState<BoardCreatePermissions>({
    notice: false,
    event: false,
    poll: false,
    tournament: false,
  });
  const [cursor, setCursor] = useState<CursorState>({ boardItemId: null });
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);
  const deleteNoticeMutation = useMutation(deleteNoticeMutationOptions(clubId));
  const deleteEventMutation = useMutation(deleteScheduleEventMutationOptions(clubId));
  const deleteVoteMutation = useMutation(deleteScheduleVoteMutationOptions(clubId));
  const deleteTournamentMutation = useMutation(deleteTournamentMutationOptions(clubId));
  const recordReadMutation = useMutation(recordBoardItemReadMutationOptions(clubId));

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

    let payload: ClubNoticeFeedResponse;
    try {
      payload = await queryClient.fetchQuery(
        noticeFeedQueryOptions(clubId, {
          pinnedOnly,
          cursorBoardItemId: mode === "append" ? cursor.boardItemId : null,
          size: 10,
        }),
      );
    } catch {
      loadingRef.current = false;
      setLoading(false);
      setInitialLoaded(true);
      setError("게시판 피드를 불러오지 못했습니다.");
      return;
    }
    loadingRef.current = false;
    setLoading(false);
    setInitialLoaded(true);
    setClubName(payload.clubName);
    setIsAdmin(payload.admin);
    setCreatePermissions({
      notice: payload.canCreateNotice,
      event: payload.canCreateSchedule,
      poll: payload.canCreatePoll,
      tournament: payload.canCreateTournament,
    });
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
    const result = await deleteNoticeMutation.mutateAsync(deleteTarget.noticeId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message ?? "공지 삭제에 실패했습니다.");
      return;
    }
    setDeleteTarget(null);
    setActiveActionKey(null);
    void invalidateClubQueries(queryClient, clubId);
    setReloadKey((current) => current + 1);
  };

  const handleModalSaved = (savedNoticeId: number) => {
    setEditingNoticeId(null);
    setActiveActionKey(null);
    void invalidateClubQueries(queryClient, clubId);
    setReloadKey((current) => current + 1);
    setDetailNoticeId(String(savedNoticeId));
  };

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) {
      return;
    }
    setDeleting(true);
    setError(null);
    const result = await deleteEventMutation.mutateAsync(deleteEventTarget.eventId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message ?? "일정 삭제에 실패했습니다.");
      return;
    }
    setDeleteEventTarget(null);
    setActiveActionKey(null);
    void invalidateClubQueries(queryClient, clubId);
    setReloadKey((current) => current + 1);
  };

  const handleDeleteVote = async () => {
    if (!deleteVoteTarget) {
      return;
    }
    setDeleting(true);
    setError(null);
    const result = await deleteVoteMutation.mutateAsync(deleteVoteTarget.voteId);
    setDeleting(false);
    if (!result.ok) {
      setError(result.message ?? "투표 삭제에 실패했습니다.");
      return;
    }
    setDeleteVoteTarget(null);
    setActiveActionKey(null);
    void invalidateClubQueries(queryClient, clubId);
    setReloadKey((current) => current + 1);
  };

  const handleDeleteTournament = async () => {
    if (!deleteTournamentTarget) {
      return;
    }
    setDeleting(true);
    const result = await deleteTournamentMutation.mutateAsync(deleteTournamentTarget.tournamentRecordId);
    setDeleting(false);
    if (!result.ok) {
      return;
    }
    setDeleteTournamentTarget(null);
    setActiveActionKey(null);
    void invalidateClubQueries(queryClient, clubId);
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
    const result = await recordReadMutation.mutateAsync(boardItemId);
    if (!result.ok || !result.data) {
      return;
    }
    patchBoardItemReadCount(boardItemId, result.data.readCount);
    void invalidateClubQueries(queryClient, clubId);
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
    try {
      const status = await queryClient.fetchQuery(
        boardReadStatusQueryOptions(clubId, boardItemId),
      );
      setReadStatusModal({ title, status });
    } catch {
      setError("읽음 현황을 불러오지 못했습니다.");
      return;
    }
  };

  if (!initialLoaded && !error) {
    return <ClubBoardFeedLoadingShell />;
  }

  const pinnedItems = items.filter(isPinnedBoardItem);
  const visibleItems = items;
  const canCreateContent = Object.values(createPermissions).some(Boolean);

  return (
    <div className="bg-[var(--background-light)] font-display text-slate-900">
      <div className="semo-page-user relative flex min-h-full flex-col bg-white/92">
        <ClubPageHeader
          title="게시판"
          subtitle={clubName}
          icon="forum"
          rightSlot={canCreateContent ? (
            <button
              type="button"
              onClick={() => setComposer("chooser")}
              className="semo-control inline-flex items-center gap-1.5 bg-[var(--primary)] px-3.5 text-sm font-bold text-white shadow-[var(--shadow-card)] transition hover:brightness-105"
            >
              <span className="material-symbols-outlined text-[19px]" aria-hidden="true">add</span>
              작성
            </button>
          ) : null}
        />

        <main className="semo-nav-bottom-space flex-1">
          <div className="space-y-6 px-4 pt-6">
            {pinnedOnly ? (
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <span
                      className="material-symbols-outlined text-rose-500 text-[20px]"
                      aria-hidden="true"
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
                      className="material-symbols-outlined text-rose-500 text-[20px]"
                      aria-hidden="true"
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
          {composer === "chooser" ? (
            <RouteModal ariaLabel="게시 콘텐츠 작성" onDismiss={() => setComposer(null)}>
              <div className="bg-white">
                <ClubPageHeader
                  title="새 콘텐츠"
                  subtitle="대표 화면에 바로 반영됩니다."
                  icon="add_circle"
                  layout="modal"
                  sticky={false}
                  rightSlot={(
                    <button
                      type="button"
                      onClick={() => setComposer(null)}
                      className="semo-icon-control text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="작성 메뉴 닫기"
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                  )}
                />
                <div className="grid grid-cols-2 gap-3 p-5">
                  {createPermissions.notice ? (
                    <button type="button" onClick={() => setComposer("notice")} className="rounded-[var(--radius-card)] border border-slate-200 p-4 text-left transition hover:border-[var(--primary)]/30 hover:bg-blue-50/50">
                      <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">campaign</span>
                      <span className="mt-3 block text-sm font-bold text-slate-900">공지</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">게시판 공지를 작성합니다.</span>
                    </button>
                  ) : null}
                  {createPermissions.event ? (
                    <button type="button" onClick={() => setComposer("event")} className="rounded-[var(--radius-card)] border border-slate-200 p-4 text-left transition hover:border-[var(--primary)]/30 hover:bg-blue-50/50">
                      <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">event</span>
                      <span className="mt-3 block text-sm font-bold text-slate-900">일정</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">캘린더와 게시판에 공유합니다.</span>
                    </button>
                  ) : null}
                  {createPermissions.poll ? (
                    <button type="button" onClick={() => setComposer("poll")} className="rounded-[var(--radius-card)] border border-slate-200 p-4 text-left transition hover:border-[var(--primary)]/30 hover:bg-blue-50/50">
                      <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">poll</span>
                      <span className="mt-3 block text-sm font-bold text-slate-900">투표</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">기간과 선택지를 정해 의견을 받습니다.</span>
                    </button>
                  ) : null}
                  {createPermissions.tournament ? (
                    <button type="button" onClick={() => setComposer("tournament")} className="rounded-[var(--radius-card)] border border-slate-200 p-4 text-left transition hover:border-[var(--primary)]/30 hover:bg-blue-50/50">
                      <span className="material-symbols-outlined text-[var(--primary)]" aria-hidden="true">emoji_events</span>
                      <span className="mt-3 block text-sm font-bold text-slate-900">대회</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">대회를 등록하고 승인을 요청합니다.</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </RouteModal>
          ) : null}
          {composer === "notice" ? (
            <RouteModal ariaLabel="공지 작성" onDismiss={() => setComposer(null)} dismissOnBackdrop={false}>
              <ClubNoticeEditorClient
                clubId={clubId}
                presentation="modal"
                basePath={`/clubs/${clubId}/board`}
                onRequestClose={() => setComposer(null)}
                onSaved={(noticeId) => {
                  setComposer(null);
                  void invalidateClubQueries(queryClient, clubId);
                  setReloadKey((current) => current + 1);
                  setDetailNoticeId(String(noticeId));
                }}
              />
            </RouteModal>
          ) : null}
          {composer === "event" ? (
            <RouteModal ariaLabel="일정 작성" onDismiss={() => setComposer(null)} dismissOnBackdrop={false}>
              <ClubScheduleEditorClient
                clubId={clubId}
                clubName={clubName}
                presentation="modal"
                onRequestClose={() => setComposer(null)}
                onSaved={(eventId) => {
                  setComposer(null);
                  void invalidateClubQueries(queryClient, clubId);
                  setReloadKey((current) => current + 1);
                  setDetailEventId(String(eventId));
                }}
              />
            </RouteModal>
          ) : null}
          {composer === "poll" ? (
            <RouteModal ariaLabel="투표 작성" onDismiss={() => setComposer(null)} dismissOnBackdrop={false}>
              <ClubScheduleVoteEditorClient
                clubId={clubId}
                clubName={clubName}
                presentation="modal"
                basePath={`/clubs/${clubId}/schedule`}
                onRequestClose={() => setComposer(null)}
                onSaved={(voteId) => {
                  setComposer(null);
                  void invalidateClubQueries(queryClient, clubId);
                  setReloadKey((current) => current + 1);
                  setDetailVoteId(String(voteId));
                }}
              />
            </RouteModal>
          ) : null}
          {composer === "tournament" ? (
            <RouteModal ariaLabel="대회 작성" onDismiss={() => setComposer(null)} dismissOnBackdrop={false}>
              <ClubTournamentEditorClient
                clubId={clubId}
                presentation="modal"
                onRequestClose={() => setComposer(null)}
                onSaved={(tournamentId) => {
                  setComposer(null);
                  void invalidateClubQueries(queryClient, clubId);
                  setReloadKey((current) => current + 1);
                  setDetailTournamentId(String(tournamentId));
                }}
              />
            </RouteModal>
          ) : null}
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
              ariaLabel="공지 수정"
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
            <RouteModal ariaLabel="일정 수정" onDismiss={() => setEditingEventId(null)} dismissOnBackdrop={false}>
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
            <RouteModal ariaLabel="투표 수정" onDismiss={() => setEditingVoteId(null)} dismissOnBackdrop={false}>
              <ClubScheduleVoteEditorClient
                clubId={clubId}
                voteId={editingVoteId}
                clubName={clubName}
                presentation="modal"
                basePath={`/clubs/${clubId}/schedule`}
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
            <RouteModal ariaLabel="대회 수정" onDismiss={() => setEditingTournamentId(null)} dismissOnBackdrop={false}>
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
