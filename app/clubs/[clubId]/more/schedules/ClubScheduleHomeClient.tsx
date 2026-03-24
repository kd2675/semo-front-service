"use client";

import { RouteModal } from "@/app/components/RouteModal";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubScheduleEventDetailModal } from "@/app/components/ClubDetailModals";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import { ClubScheduleEditorClient } from "@/app/clubs/[clubId]/schedule/ClubScheduleEditorClient";
import { BoardScheduleManageCard } from "@/app/clubs/[clubId]/board/BoardScheduleManageCard";
import {
  deleteClubScheduleEvent,
  type ClubScheduleEventSummary,
  type ClubScheduleHomeResponse,
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

function getDdayLabel(dateValue: string) {
  const targetDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(targetDate.getTime())) {
    return "일정일 확인";
  }
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((targetDate.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) {
    return "오늘 시작";
  }
  if (diffDays > 0) {
    return `D-${diffDays}`;
  }
  return `${Math.abs(diffDays)}일 경과`;
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
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deleteEventTarget, setDeleteEventTarget] = useState<ClubScheduleEventSummary | null>(null);
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const accent = mode === "admin" ? "#f97316" : "#135bec";
  const background = "#f6f6f8";
  const nearestUpcomingEvent = useMemo(() => {
    return [...payload.events]
      .filter((event) => new Date(`${event.startDate}T00:00:00`).getTime() >= new Date(new Date().toDateString()).getTime())
      .sort((left, right) => left.startDate.localeCompare(right.startDate))[0] ?? null;
  }, [payload.events]);

  const items = useMemo(() => {
    return payload.events.map((event) => ({
      key: `event-${event.eventId}`,
      pinned: event.pinned ? 1 : 0,
      sortValue: `${event.startDate}T${event.timeLabel ?? "00:00"}`,
      event,
    }))
      .sort((left, right) => {
        if (left.pinned !== right.pinned) {
          return right.pinned - left.pinned;
        }
        return right.sortValue.localeCompare(left.sortValue);
      });
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
          <section className="px-4 pt-6">
            {mode === "admin" ? (
              <motion.div className="mb-6 space-y-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
                <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_58%,#fff1e7_100%)] p-6 shadow-[0_18px_50px_rgba(249,115,22,0.12)] ring-1 ring-orange-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="max-w-[70%]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-orange-500">
                        Schedule Control
                      </p>
                      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">일정 운영 현황</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        예정 일정 수와 공유 상태를 중심으로 이번 모임의 운영 리듬을 한 화면에서 확인합니다.
                      </p>
                    </div>
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                      <span className="material-symbols-outlined text-[30px]">edit_calendar</span>
                    </div>
                  </div>
                  <div className="mt-5 rounded-[24px] bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">가장 가까운 일정</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {nearestUpcomingEvent ? nearestUpcomingEvent.title : "예정된 일정이 없습니다."}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {nearestUpcomingEvent
                        ? `${nearestUpcomingEvent.dateLabel}${nearestUpcomingEvent.timeLabel ? ` · ${nearestUpcomingEvent.timeLabel}` : ""} · ${getDdayLabel(nearestUpcomingEvent.startDate)}`
                        : "새 일정을 등록하면 가장 먼저 다가오는 일정이 여기 표시됩니다."}
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-3">
                  <AdminInsightTile
                    icon="event_note"
                    label="전체 일정"
                    value={payload.totalEventCount.toLocaleString("ko-KR")}
                    detail={`관리 가능한 일정 ${payload.manageableItemCount.toLocaleString("ko-KR")}건`}
                  />
                  <AdminInsightTile
                    icon="event_upcoming"
                    label="예정 일정"
                    value={payload.upcomingEventCount.toLocaleString("ko-KR")}
                    detail="오늘 이후 시작하는 일정 수"
                  />
                  <AdminInsightTile
                    icon="campaign"
                    label="공지 공유"
                    value={payload.sharedNotices.length.toLocaleString("ko-KR")}
                    detail="일정 화면에 연결된 공지 콘텐츠 수"
                  />
                  <AdminInsightTile
                    icon="poll"
                    label="투표 공유"
                    value={payload.sharedVotes.length.toLocaleString("ko-KR")}
                    detail="일정과 함께 관리되는 투표 수"
                  />
                </div>
              </motion.div>
            ) : null}

            {mode === "admin" ? null : (
            <motion.div className="mb-4 flex items-center justify-between" {...staggeredFadeUpMotion(5, reduceMotion)}>
              <div className="flex min-w-0 items-center gap-3">
                <h3 className="shrink-0 rounded-lg border border-[var(--primary)]/15 bg-[var(--primary)]/[0.08] px-3 py-1.5 text-sm font-bold tracking-[-0.02em] text-[var(--primary)] shadow-sm">
                  내 일정
                </h3>
              </div>
              <div className="shrink-0 text-sm font-bold text-[var(--primary)]">
                {payload.manageableItemCount.toLocaleString("ko-KR")}건
              </div>
            </motion.div>
            )}

            {mode === "admin" ? null : (
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
                    placeholder="캘린더 제목으로 검색"
                    type="text"
                  />
                </div>
              </label>
            </motion.div>
            )}

            {mode === "admin" ? null : (
            <div className="space-y-4 pb-4">
              {filteredItems.length === 0 ? (
                <motion.div
                  className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500"
                  {...staggeredFadeUpMotion(8, reduceMotion)}
                >
                  표시할 캘린더 항목이 없습니다.
                </motion.div>
              ) : (
                filteredItems.map((item, index) => (
                  <motion.div
                    key={item.key}
                    {...staggeredFadeUpMotion(index + 8, reduceMotion)}
                    className={activeActionKey === item.key ? "relative z-20" : "relative"}
                  >
                    <BoardScheduleManageCard
                      event={item.event}
                      canEdit={item.event.canEdit}
                      canDelete={item.event.canDelete}
                      showBoardShareBadge
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
            )}
          </section>
        </main>

        {payload.canCreate && mode !== "admin" ? (
          <button
            type="button"
            aria-label="캘린더 항목 만들기"
            onClick={() => setShowEventCreateModal(true)}
            className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-transform active:scale-95 ${
              mode === "user" && payload.admin ? "bottom-40" : "bottom-24"
            }`}
            style={{ boxShadow: "0 6px 16px rgba(19, 91, 236, 0.32)" }}
          >
            <span className="material-symbols-outlined text-[28px]">add</span>
          </button>
        ) : null}

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
            title="캘린더 항목을 삭제할까요?"
            description={`‘${deleteEventTarget.title}’ 항목은 삭제 후 복구할 수 없습니다.`}
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
