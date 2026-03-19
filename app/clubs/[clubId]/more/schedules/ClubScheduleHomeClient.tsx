"use client";

import { RouteModal } from "@/app/components/RouteModal";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubNoticeDetailModal, ClubPollDetailModal, ClubScheduleEventDetailModal } from "@/app/components/ClubDetailModals";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import { ClubScheduleEditorClient } from "@/app/clubs/[clubId]/schedule/ClubScheduleEditorClient";
import { ScheduleManageCard } from "@/app/clubs/[clubId]/schedule/ScheduleManageCard";
import {
  deleteClubScheduleEvent,
  type ClubNoticeListItem,
  type ClubScheduleEventSummary,
  type ClubScheduleHomeResponse,
  type ClubScheduleVoteSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { startTransition, useDeferredValue, useMemo, useState, type CSSProperties } from "react";

type ClubScheduleHomeClientProps = {
  clubId: string;
  payload: ClubScheduleHomeResponse;
  mode?: "user" | "admin";
  onReload: () => void;
};

function MetricsCard({
  label,
  value,
  accent,
  highlighted = false,
}: {
  label: string;
  value: number;
  accent: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`min-w-[116px] flex-1 rounded-xl border bg-white p-3 ${
        highlighted ? "border-l-4" : "border-slate-200"
      }`}
      style={highlighted ? { borderLeftColor: accent } : undefined}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

function AdminMetricsCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
          style={{ backgroundColor: accent }}
        >
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function getEventVisual(event: ClubScheduleEventSummary) {
  if (event.feeRequired) {
    return {
      icon: "paid",
      iconClassName: "text-amber-500",
      iconSurfaceClassName: "bg-amber-500/10",
    };
  }
  if (event.locationLabel) {
    return {
      icon: "event",
      iconClassName: "text-[var(--primary)]",
      iconSurfaceClassName: "bg-[var(--primary)]/10",
    };
  }
  return {
    icon: "calendar_month",
    iconClassName: "text-slate-500",
    iconSurfaceClassName: "bg-slate-100",
  };
}

function getEventSecondaryText(event: ClubScheduleEventSummary) {
  const parts = [event.dateLabel, event.timeLabel, event.locationLabel].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "세부 안내 없음";
}

function getSharedNoticeTimeLabel(notice: ClubNoticeListItem) {
  return notice.publishedAtLabel || notice.timeAgo;
}

function getSharedVoteStatusLabel(vote: ClubScheduleVoteSummary) {
  if (vote.voteStatus === "CLOSED") {
    return "종료";
  }
  if (vote.voteStatus === "WAITING") {
    return "예정";
  }
  return vote.mySelectedOptionId ? "참여 완료" : "진행 중";
}

function EventHomeCard({
  event,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
}: {
  event: ClubScheduleEventSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const visual = getEventVisual(event);

  return (
    <ScheduleManageCard
      variant="menu"
      label={event.title}
      manageable={true}
      open={open}
      onOpenChange={onOpenChange}
      onOpen={onOpen}
      onEdit={onEdit}
      onDelete={onDelete}
    >
      <div className="rounded-[8px] border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${visual.iconSurfaceClassName} ${visual.iconClassName}`}
            >
              <span className="material-symbols-outlined">{visual.icon}</span>
            </div>
            <div className="min-w-0">
              <span className="inline-flex rounded bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-bold uppercase text-[var(--primary)]">
                일정
              </span>
              <h3 className="mt-2 line-clamp-1 text-base font-bold text-slate-900">{event.title}</h3>
            </div>
          </div>
          <span className="shrink-0 text-xs text-slate-400">{event.timeLabel ?? event.dateLabel}</span>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-slate-500">{getEventSecondaryText(event)}</p>
      </div>
    </ScheduleManageCard>
  );
}


export function ClubScheduleHomeClient({
  clubId,
  payload,
  mode = "user",
  onReload,
}: ClubScheduleHomeClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [showEventCreateModal, setShowEventCreateModal] = useState(false);
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [sharedNoticeDetailId, setSharedNoticeDetailId] = useState<string | null>(null);
  const [sharedVoteDetailId, setSharedVoteDetailId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<ClubScheduleEventSummary | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const accent = mode === "admin" ? "#f97316" : "#135bec";
  const background = "#f6f6f8";
  const sharedNotices = payload.sharedNotices ?? [];
  const sharedVotes = payload.sharedVotes ?? [];

  const items = useMemo(() => {
    return payload.events.map((event) => ({
      key: `event-${event.eventId}`,
      sortValue: `${event.startDate}T${event.timeLabel ?? "00:00"}`,
      event,
    }))
      .sort((left, right) => right.sortValue.localeCompare(left.sortValue));
  }, [payload.events]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return items;
    }
    return items.filter((item) => {
      const searchText = `${item.event.title} ${item.event.locationLabel ?? ""} ${item.event.dateLabel}`;
      return searchText.toLowerCase().includes(normalizedQuery);
    });
  }, [deferredQuery, items]);

  const handleDeleteEvent = async () => {
    if (!deleteEventTarget) {
      return;
    }
    setDeleting(true);
    const result = await deleteClubScheduleEvent(clubId, deleteEventTarget.eventId);
    setDeleting(false);
    if (!result.ok) {
      return;
    }
    setDeleteEventTarget(null);
    setActiveActionKey(null);
    onReload();
  };

  return (
    <div
      className="min-h-full bg-[var(--background-light)] font-display text-slate-900"
      style={{ "--primary": accent, "--background-light": background } as CSSProperties}
    >
      <div className="relative mx-auto flex min-h-full max-w-md flex-col bg-[var(--background-light)]">
        <ClubPageHeader
          title="일정 관리"
          subtitle={payload.clubName}
          icon="edit_calendar"
          theme={mode === "admin" ? "admin" : "user"}
          containerClassName="max-w-md"
          className={mode === "admin" ? "border-orange-100" : undefined}
        />

        <main className="semo-nav-bottom-space flex-1">
          {mode === "admin" ? (
            <>
              <section className="px-4 py-6">
                <motion.div className="mb-4 flex items-end justify-between" {...staggeredFadeUpMotion(0, reduceMotion)}>
                  <div>
                    <h2 className="text-lg font-bold">일정 운영 현황</h2>
                    <p className="mt-1 text-sm text-slate-500">운영 중인 일정 흐름을 확인하고 바로 관리합니다.</p>
                  </div>
                  <span className="text-sm font-medium text-[var(--primary)]">실시간</span>
                </motion.div>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div {...staggeredFadeUpMotion(1, reduceMotion)}>
                    <AdminMetricsCard label="전체 일정" value={payload.totalEventCount} icon="calendar_month" accent={accent} />
                  </motion.div>
                  <motion.div {...staggeredFadeUpMotion(2, reduceMotion)}>
                    <AdminMetricsCard label="관리 가능" value={payload.manageableItemCount} icon="edit_calendar" accent={accent} />
                  </motion.div>
                  <motion.div {...staggeredFadeUpMotion(3, reduceMotion)}>
                    <AdminMetricsCard label="다가오는 일정" value={payload.upcomingEventCount} icon="upcoming" accent={accent} />
                  </motion.div>
                  <motion.div {...staggeredFadeUpMotion(4, reduceMotion)}>
                    <AdminMetricsCard label="등록 완료" value={payload.totalEventCount - payload.upcomingEventCount} icon="event_available" accent={accent} />
                  </motion.div>
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="px-4 pt-6 pb-2">
                <motion.h2 className="text-2xl font-bold text-slate-900" {...staggeredFadeUpMotion(0, reduceMotion)}>
                  일정 관리
                </motion.h2>
                <motion.p className="mt-1 text-sm text-slate-500" {...staggeredFadeUpMotion(1, reduceMotion)}>
                  내가 만든 일정만 모아서 관리합니다.
                </motion.p>
              </section>

              <motion.section className="hide-scrollbar flex gap-3 overflow-x-auto px-4 py-2" {...staggeredFadeUpMotion(2, reduceMotion)}>
                <MetricsCard label="일정" value={payload.totalEventCount} accent={accent} />
                <MetricsCard label="다가오는 일정" value={payload.upcomingEventCount} accent={accent} highlighted />
                <MetricsCard label="전체 관리" value={payload.manageableItemCount} accent={accent} />
              </motion.section>
            </>
          )}

          {mode === "user" ? (
            <section className="mt-6 px-4">
              <motion.div className="mb-4 flex items-center justify-between" {...staggeredFadeUpMotion(5, reduceMotion)}>
                <div>
                  <h3 className="text-lg font-bold">내 일정 목록</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    카드를 누르면 바로 상세를 보고, 점 세 개 버튼으로 수정과 삭제를 합니다.
                  </p>
                </div>
                <div className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  {payload.manageableItemCount}건
                </div>
              </motion.div>

              {payload.canCreate ? (
                <motion.div className="mb-4 flex justify-end" {...staggeredFadeUpMotion(6, reduceMotion)}>
                  <button
                    type="button"
                    onClick={() => setShowEventCreateModal(true)}
                    className="flex size-14 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_10px_24px_rgba(19,91,236,0.28)] transition hover:brightness-105"
                    aria-label="일정 만들기"
                  >
                    <span className="material-symbols-outlined text-[26px]">add</span>
                  </button>
                </motion.div>
              ) : null}

              <motion.div className="mb-4" {...staggeredFadeUpMotion(7, reduceMotion)}>
                <label className="block">
                  <div className="flex h-12 items-center rounded-[8px] border border-slate-200 bg-white px-4 shadow-sm">
                    <span className="material-symbols-outlined text-[20px] text-slate-400">search</span>
                    <input
                      value={query}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        startTransition(() => {
                          setQuery(nextValue);
                        });
                      }}
                      className="ml-3 w-full border-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                      placeholder="제목으로 검색"
                      type="text"
                    />
                  </div>
                </label>
              </motion.div>

              <div className="space-y-4 pb-4">
                {filteredItems.length === 0 ? (
                  <motion.div
                    className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500"
                    {...staggeredFadeUpMotion(8, reduceMotion)}
                  >
                    표시할 일정이 없습니다.
                  </motion.div>
                ) : (
                  filteredItems.map((item, index) => (
                    <motion.div key={item.key} {...staggeredFadeUpMotion(index + 8, reduceMotion)}>
                      <EventHomeCard
                        event={item.event}
                        open={activeActionKey === item.key}
                        onOpenChange={(open) => setActiveActionKey(open ? item.key : null)}
                        onOpen={() => {
                          setActiveActionKey(null);
                          setDetailEventId(String(item.event.eventId));
                        }}
                        onEdit={() => {
                          setActiveActionKey(null);
                          setEditingEventId(String(item.event.eventId));
                        }}
                        onDelete={() => {
                          setActiveActionKey(null);
                          setDeleteEventTarget(item.event);
                        }}
                      />
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          ) : null}

          {sharedNotices.length > 0 || sharedVotes.length > 0 ? (
            <section className={`px-4 pb-8 ${mode === "user" ? "" : "pt-4"}`}>
              <motion.div className="mb-4 flex items-center justify-between" {...staggeredFadeUpMotion(20, reduceMotion)}>
                <div>
                  <h3 className="text-lg font-bold">공지/투표 공유 항목</h3>
                  <p className="mt-1 text-sm text-slate-500">일정 화면에서 함께 보여줄 공유 데이터를 확인합니다.</p>
                </div>
                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  {sharedNotices.length + sharedVotes.length}건
                </span>
              </motion.div>

              {sharedNotices.length > 0 ? (
                <motion.div className="mb-6 space-y-3" {...staggeredFadeUpMotion(21, reduceMotion)}>
                  <h4 className="text-sm font-bold text-slate-700">공유 공지</h4>
                  {sharedNotices.map((notice) => (
                    <button
                      type="button"
                      key={`shared-notice-${notice.noticeId}`}
                      onClick={() => setSharedNoticeDetailId(String(notice.noticeId))}
                      className="block w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[var(--primary)]/50"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="rounded bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-bold uppercase text-[var(--primary)]">
                          공지
                        </span>
                        <span className="text-xs text-slate-400">{getSharedNoticeTimeLabel(notice)}</span>
                      </div>
                      <p className="line-clamp-1 text-sm font-bold text-slate-900">{notice.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{notice.summary}</p>
                    </button>
                  ))}
                </motion.div>
              ) : null}

              {sharedVotes.length > 0 ? (
                <motion.div className="space-y-3" {...staggeredFadeUpMotion(22, reduceMotion)}>
                  <h4 className="text-sm font-bold text-slate-700">공유 투표</h4>
                  {sharedVotes.map((vote) => (
                    <button
                      type="button"
                      key={`shared-vote-${vote.voteId}`}
                      onClick={() => setSharedVoteDetailId(String(vote.voteId))}
                      className="block w-full rounded-xl border border-amber-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-400/70"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-600">
                          투표
                        </span>
                        <span className="text-xs text-slate-400">{getSharedVoteStatusLabel(vote)}</span>
                      </div>
                      <p className="line-clamp-1 text-sm font-bold text-slate-900">{vote.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {vote.votePeriodLabel}
                        {vote.voteTimeLabel ? ` • ${vote.voteTimeLabel}` : ""}
                        {` • ${vote.optionCount}개 항목`}
                      </p>
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </section>
          ) : null}
        </main>

        {mode === "user" && payload.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}

        <AnimatePresence>
          {showEventCreateModal ? (
            <RouteModal onDismiss={() => setShowEventCreateModal(false)} dismissOnBackdrop={false}>
              <ClubScheduleEditorClient
                clubId={clubId}
                clubName={payload.clubName}
                presentation="modal"
                onRequestClose={() => setShowEventCreateModal(false)}
                onSaved={(savedEventId) => {
                  setShowEventCreateModal(false);
                  onReload();
                  setDetailEventId(String(savedEventId));
                }}
              />
            </RouteModal>
          ) : null}

          {detailEventId ? (
            <ClubScheduleEventDetailModal
              clubId={clubId}
              eventId={detailEventId}
              onRequestClose={() => setDetailEventId(null)}
            />
          ) : null}

          {sharedNoticeDetailId ? (
            <ClubNoticeDetailModal
              clubId={clubId}
              noticeId={sharedNoticeDetailId}
              mode={mode}
              onRequestClose={() => setSharedNoticeDetailId(null)}
            />
          ) : null}

          {sharedVoteDetailId ? (
            <ClubPollDetailModal
              clubId={clubId}
              voteId={sharedVoteDetailId}
              mode={mode}
              onRequestClose={() => setSharedVoteDetailId(null)}
            />
          ) : null}

          {editingEventId ? (
            <RouteModal onDismiss={() => setEditingEventId(null)} dismissOnBackdrop={false}>
              <ClubScheduleEditorClient
                clubId={clubId}
                eventId={editingEventId}
                clubName={payload.clubName}
                presentation="modal"
                onRequestClose={() => setEditingEventId(null)}
                onSaved={(savedEventId) => {
                  setEditingEventId(null);
                  onReload();
                  setDetailEventId(String(savedEventId));
                }}
                onDeleted={() => {
                  setEditingEventId(null);
                  onReload();
                }}
              />
            </RouteModal>
          ) : null}
        </AnimatePresence>

        {deleteEventTarget ? (
          <ScheduleActionConfirmModal
            title="일정을 삭제할까요?"
            description={`‘${deleteEventTarget.title}’ 일정은 삭제 후 복구할 수 없습니다.`}
            confirmLabel="삭제"
            busyLabel="삭제 중..."
            busy={deleting}
            onCancel={() => {
              if (!deleting) {
                setDeleteEventTarget(null);
              }
            }}
            onConfirm={() => {
              void handleDeleteEvent();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
