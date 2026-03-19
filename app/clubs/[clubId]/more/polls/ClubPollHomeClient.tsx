"use client";

import { RouteModal } from "@/app/components/RouteModal";
import { RouterLink } from "@/app/components/RouterLink";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubPollDetailModal } from "@/app/components/ClubDetailModals";
import { ClubScheduleVoteEditorClient } from "@/app/clubs/[clubId]/schedule/ClubScheduleVoteEditorClient";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import { ScheduleManageCard } from "@/app/clubs/[clubId]/schedule/ScheduleManageCard";
import { deleteClubScheduleVote, type ClubPollHomeResponse, type ClubPollSummary } from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
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
  manageable,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
}: {
  poll: ClubPollSummary;
  manageable: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getStatusBadge(poll);
  const previewOptions = getPreviewOptions(poll);

  return (
    <ScheduleManageCard
      variant="menu"
      label={poll.title}
      manageable={manageable}
      open={open}
      onOpenChange={onOpenChange}
      onOpen={onOpen}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${status.className}`}>
              {status.label}
            </span>
            {poll.postedToBoard ? (
              <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                공지 공유
              </span>
            ) : null}
            {poll.sharedToSchedule ? (
              <span className="rounded bg-indigo-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                일정 공유
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
      </article>
    </ScheduleManageCard>
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
        {mode === "user" ? (
          <ClubPageHeader title="투표 관리" subtitle={payload.clubName} />
        ) : (
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
            <div className="flex items-center gap-4">
              <RouterLink
                href={`/clubs/${clubId}/admin`}
                className="p-1"
                aria-label="뒤로 가기"
              >
                <span className="material-symbols-outlined text-[24px] text-gray-800">arrow_back</span>
              </RouterLink>
              <h1 className="text-xl font-bold text-gray-900">투표 관리</h1>
            </div>
            <button type="button" className="p-2 text-gray-500" aria-label="검색">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>
          </header>
        )}

        <main className="semo-nav-bottom-space flex-1 pb-24">
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
                      manageable={poll.canManage}
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
        </main>

        {payload.canCreate ? (
          <button
            type="button"
            aria-label="투표 생성"
            onClick={() => setShowCreateModal(true)}
            className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-transform active:scale-95 ${
              mode === "user" && payload.admin ? "bottom-40" : "bottom-24"
            }`}
            style={{
              boxShadow:
                mode === "admin"
                  ? "0 4px 14px rgba(236, 91, 19, 0.35)"
                  : "0 4px 14px rgba(19, 91, 236, 0.35)",
            }}
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
