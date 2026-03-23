"use client";

import { RouteModal } from "@/app/components/RouteModal";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubPollDetailModal } from "@/app/components/ClubDetailModals";
import { ClubScheduleVoteEditorClient } from "@/app/clubs/[clubId]/schedule/ClubScheduleVoteEditorClient";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import { deleteClubScheduleVote, type ClubPollHomeResponse, type ClubPollSummary } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { startTransition, useDeferredValue, useMemo, useState, type CSSProperties } from "react";

type ClubPollHomeClientProps = {
  clubId: string;
  payload: ClubPollHomeResponse;
  mode?: "user" | "admin";
  onReload: () => void;
};

type PollTabKey = "ONGOING" | "WAITING" | "CLOSED";

const POLL_TABS: Array<{ key: PollTabKey; label: string }> = [
  { key: "ONGOING", label: "투표 중" },
  { key: "WAITING", label: "투표 대기" },
  { key: "CLOSED", label: "투표 종료" },
];

function AdminInsightTile({
  icon,
  label,
  value,
  detail,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[24px] border border-orange-100 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

function getStatusBadge(poll: ClubPollSummary) {
  if (poll.voteStatus === "WAITING") {
    return {
      label: "대기",
      className: "bg-amber-50 text-amber-600",
    };
  }
  if (poll.voteStatus === "CLOSED") {
    return {
      label: "종료",
      className: "bg-slate-100 text-slate-500",
    };
  }
  return {
    label: "진행 중",
    className: "bg-blue-50 text-blue-600",
  };
}

function getPreviewOptions(poll: ClubPollSummary) {
  return [...poll.options]
    .sort((left, right) => right.voteCount - left.voteCount || left.sortOrder - right.sortOrder)
    .slice(0, 2);
}

function getOptionPercent(voteCount: number, totalResponses: number) {
  if (totalResponses <= 0) {
    return 0;
  }
  return Math.round((voteCount / totalResponses) * 100);
}

function PollCard({
  poll,
  canEdit,
  canDelete,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
}: {
  poll: ClubPollSummary;
  canEdit: boolean;
  canDelete: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getStatusBadge(poll);
  const previewOptions = getPreviewOptions(poll);
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const authorAvatarUrl = poll.authorAvatarThumbnailUrl ?? poll.authorAvatarImageUrl;
  const manageable = canEdit || canDelete;

  return (
    <article className="relative overflow-visible rounded-[8px] border border-slate-100 bg-white shadow-sm">
      <div className="relative z-10 flex items-center justify-between gap-3 px-4 pb-2 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          {authorAvatarUrl ? (
            <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-100">
              <Image src={authorAvatarUrl} alt={poll.authorDisplayName} fill sizes="32px" className="object-cover" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
              {poll.authorDisplayName.slice(0, 1)}
            </div>
          )}
          <p className="min-w-0 truncate text-sm font-semibold text-slate-600">{poll.authorDisplayName}</p>
        </div>
        {manageable ? (
          <div className="relative">
            <button
              type="button"
              aria-label={`${poll.title} 관리 메뉴`}
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
        aria-label={`${poll.title} 자세히 보기`}
        className="block w-full px-4 pb-4 pt-3 text-left transition-colors hover:bg-slate-50"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${status.className}`}>
              {status.label}
            </span>
            {poll.postedToBoard ? (
              <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                게시판 공유
              </span>
            ) : null}
            {poll.postedToCalendar ? (
              <span className="rounded bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                캘린더 공유
              </span>
            ) : null}
          </div>
          <span className="text-[10px] font-medium text-gray-400">{poll.voteWindowLabel}</span>
        </div>

        <h3 className="mb-1 text-base font-bold text-gray-900">{poll.title}</h3>
        <p className="mb-4 text-xs text-gray-500">{poll.totalResponses}명 참여</p>

        {previewOptions.length <= 2 ? (
          <div className="space-y-2">
            {previewOptions.map((option, index) => {
              const percent = getOptionPercent(option.voteCount, poll.totalResponses);
              const isTop = index === 0;
              return (
                <div key={option.voteOptionId} className="relative pt-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-700">{option.label}</span>
                    <span className={`text-[11px] font-semibold ${isTop ? "text-blue-600" : "text-gray-400"}`}>
                      {percent}%
                    </span>
                  </div>
                  <div className="flex h-1.5 overflow-hidden rounded bg-gray-100 text-xs">
                    <div
                      className={`flex flex-col justify-center whitespace-nowrap text-center text-white ${isTop ? "bg-blue-500" : "bg-gray-300"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-2">
            {previewOptions.map((option, index) => (
              <div key={option.voteOptionId} className="flex-1 rounded-lg border border-gray-100 bg-gray-50 p-2 text-center">
                <span className="block text-[10px] uppercase text-gray-400">상위 {index + 1}</span>
                <span className="block text-xs font-bold text-gray-800">{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </button>
    </article>
  );
}

export function ClubPollHomeClient({
  clubId,
  payload,
  mode = "user",
  onReload,
}: ClubPollHomeClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [activeTab, setActiveTab] = useState<PollTabKey>("ONGOING");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailVoteId, setDetailVoteId] = useState<string | null>(null);
  const [editingVoteId, setEditingVoteId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubPollSummary | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const accent = mode === "admin" ? "#ec5b13" : "#135bec";
  const background = mode === "admin" ? "#f8f6f6" : "#f6f6f8";
  const basePath = mode === "admin" ? `/clubs/${clubId}/admin/more/polls` : `/clubs/${clubId}/more/polls`;
  const totalResponses = useMemo(
    () => payload.polls.reduce((sum, poll) => sum + poll.totalResponses, 0),
    [payload.polls],
  );
  const priorityPoll = useMemo(() => {
    const ongoing = [...payload.polls]
      .filter((poll) => poll.voteStatus === "ONGOING")
      .sort((left, right) => left.voteEndDate.localeCompare(right.voteEndDate))[0];
    if (ongoing) {
      return ongoing;
    }
    const waiting = [...payload.polls]
      .filter((poll) => poll.voteStatus === "WAITING")
      .sort((left, right) => left.voteStartDate.localeCompare(right.voteStartDate))[0];
    return waiting ?? payload.polls[0] ?? null;
  }, [payload.polls]);

  const filteredPolls = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return payload.polls.filter((poll) => {
      if (poll.voteStatus !== activeTab) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return poll.title.toLowerCase().includes(normalizedQuery);
    });
  }, [activeTab, deferredQuery, payload.polls]);

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    const result = await deleteClubScheduleVote(clubId, deleteTarget.voteId);
    setDeleting(false);
    if (!result.ok) {
      return;
    }

    setDeleteTarget(null);
    setActiveActionKey(null);
    onReload();
  };

  const tabCountByKey = {
    WAITING: payload.waitingCount,
    ONGOING: payload.ongoingCount,
    CLOSED: payload.closedCount,
  } satisfies Record<PollTabKey, number>;

  return (
    <div
      className="min-h-full bg-[var(--background-light)] font-display text-gray-900"
      style={{ "--primary": accent, "--background-light": background } as CSSProperties}
    >
      <div className="relative mx-auto flex min-h-full max-w-md flex-col bg-[var(--background-light)]">
        <ClubPageHeader
          title="투표 관리"
          subtitle={payload.clubName}
          icon="how_to_vote"
          theme={mode === "admin" ? "admin" : "user"}
          containerClassName="max-w-md"
        />

        <main className="semo-nav-bottom-space flex-1 pb-24">
          {mode === "admin" ? (
            <section className="space-y-4 px-4 pt-6">
              <motion.div className="space-y-4" {...staggeredFadeUpMotion(0, reduceMotion)}>
                <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_58%,#fff1e7_100%)] p-6 shadow-[0_18px_50px_rgba(249,115,22,0.12)] ring-1 ring-orange-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="max-w-[70%]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-orange-500">
                        Poll Control
                      </p>
                      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">투표 운영 현황</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        진행 상태, 응답 수, 마감 시점을 기준으로 현재 의사결정 흐름을 빠르게 파악합니다.
                      </p>
                    </div>
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                      <span className="material-symbols-outlined text-[30px]">poll</span>
                    </div>
                  </div>
                  <div className="mt-5 rounded-[24px] bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">우선 확인할 투표</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {priorityPoll ? priorityPoll.title : "아직 생성된 투표가 없습니다."}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {priorityPoll
                        ? `${priorityPoll.voteWindowLabel} · 응답 ${priorityPoll.totalResponses.toLocaleString("ko-KR")}건`
                        : "새 투표를 만들면 진행 상태와 마감 시점이 여기 표시됩니다."}
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-3">
                  <AdminInsightTile
                    icon="rule"
                    label="전체 투표"
                    value={payload.polls.length.toLocaleString("ko-KR")}
                    detail="현재 저장된 전체 투표 수"
                  />
                  <AdminInsightTile
                    icon="hourglass_top"
                    label="진행 중"
                    value={payload.ongoingCount.toLocaleString("ko-KR")}
                    detail="지금 응답을 받고 있는 투표 수"
                  />
                  <AdminInsightTile
                    icon="schedule"
                    label="투표 대기"
                    value={payload.waitingCount.toLocaleString("ko-KR")}
                    detail="아직 시작 전인 투표 수"
                  />
                  <AdminInsightTile
                    icon="group"
                    label="총 응답"
                    value={totalResponses.toLocaleString("ko-KR")}
                    detail={`종료 투표 ${payload.closedCount.toLocaleString("ko-KR")}건 포함 누적 응답`}
                  />
                </div>
              </motion.div>
            </section>
          ) : null}

          {mode === "admin" ? null : (
          <nav className="flex border-b border-gray-200 bg-white">
            {POLL_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setActiveTab(tab.key);
                    });
                  }}
                  className={`flex-1 border-b-2 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? "border-[var(--primary)] text-[var(--primary)]"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 text-[11px]">{tabCountByKey[tab.key]}</span>
                </button>
              );
            })}
          </nav>
          )}

          {mode === "admin" ? null : (
          <section className="p-4" data-purpose="search-section">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-[var(--primary)] focus:ring-[var(--primary)]"
                placeholder="투표 제목으로 검색하세요"
                type="text"
              />
            </div>
          </section>
          )}

          {mode === "admin" ? null : (
          <section className="space-y-4 px-4" data-purpose="poll-list">
            {filteredPolls.length === 0 ? (
              <motion.div
                className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-sm text-gray-500"
                {...staggeredFadeUpMotion(0, reduceMotion)}
              >
                선택한 상태의 투표가 없습니다.
              </motion.div>
            ) : (
              filteredPolls.map((poll, index) => {
                const actionKey = `poll-${poll.voteId}`;
                return (
                  <motion.div key={poll.voteId} {...staggeredFadeUpMotion(index, reduceMotion)}>
                    <PollCard
                      poll={poll}
                      canEdit={poll.canEdit}
                      canDelete={poll.canDelete}
                      open={activeActionKey === actionKey}
                      onOpenChange={(open) => {
                        setActiveActionKey(open ? actionKey : null);
                      }}
                      onOpen={() => {
                        setActiveActionKey(null);
                        setDetailVoteId(String(poll.voteId));
                      }}
                      onEdit={() => {
                        setActiveActionKey(null);
                        setEditingVoteId(String(poll.voteId));
                      }}
                      onDelete={() => {
                        setActiveActionKey(null);
                        setDeleteTarget(poll);
                      }}
                    />
                  </motion.div>
                );
              })
            )}
          </section>
          )}
        </main>

        {payload.canCreate && mode !== "admin" ? (
          <button
            type="button"
            aria-label="투표 생성"
            onClick={() => setShowCreateModal(true)}
            className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-transform active:scale-95 ${
              mode === "user" && payload.admin ? "bottom-40" : "bottom-24"
            }`}
            style={{ boxShadow: "0 4px 14px rgba(19, 91, 236, 0.35)" }}
          >
            <span className="material-symbols-outlined text-[30px]">add</span>
          </button>
        ) : null}

        {mode === "user" && payload.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}

        <AnimatePresence>
          {showCreateModal ? (
            <RouteModal onDismiss={() => setShowCreateModal(false)} dismissOnBackdrop={false}>
              <ClubScheduleVoteEditorClient
                clubId={clubId}
                clubName={payload.clubName}
                presentation="modal"
                basePath={basePath}
                onRequestClose={() => setShowCreateModal(false)}
                onSaved={(savedVoteId) => {
                  setShowCreateModal(false);
                  onReload();
                  setDetailVoteId(String(savedVoteId));
                }}
              />
            </RouteModal>
          ) : null}

          {detailVoteId ? (
            <ClubPollDetailModal
              clubId={clubId}
              voteId={detailVoteId}
              mode={mode}
              onRequestClose={() => setDetailVoteId(null)}
            />
          ) : null}

          {editingVoteId ? (
            <RouteModal onDismiss={() => setEditingVoteId(null)} dismissOnBackdrop={false}>
              <ClubScheduleVoteEditorClient
                clubId={clubId}
                voteId={editingVoteId}
                clubName={payload.clubName}
                presentation="modal"
                basePath={basePath}
                onRequestClose={() => setEditingVoteId(null)}
                onSaved={(savedVoteId) => {
                  setEditingVoteId(null);
                  onReload();
                  setDetailVoteId(String(savedVoteId));
                }}
              />
            </RouteModal>
          ) : null}
        </AnimatePresence>

        {deleteTarget ? (
          <ScheduleActionConfirmModal
            title="투표를 삭제할까요?"
            description={`‘${deleteTarget.title}’ 투표와 연결된 선택 데이터가 함께 제거됩니다.`}
            confirmLabel="삭제"
            busyLabel="삭제 중..."
            busy={deleting}
            onCancel={() => {
              if (!deleting) {
                setDeleteTarget(null);
              }
            }}
            onConfirm={() => {
              void handleDelete();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
