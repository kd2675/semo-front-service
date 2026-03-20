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
          {mode === "user" ? (
            <section className="px-4 pt-6">
              <motion.div className="mb-4 flex items-center justify-between" {...staggeredFadeUpMotion(5, reduceMotion)}>
                <div className="flex min-w-0 items-center gap-3">
                  <h3 className="shrink-0 rounded-lg border border-[var(--primary)]/15 bg-[var(--primary)]/[0.08] px-3 py-1.5 text-sm font-bold tracking-[-0.02em] text-[var(--primary)] shadow-sm">
                    내 일정
                  </h3>
                </div>
                <div className="shrink-0 text-sm font-bold text-[var(--primary)]">
                  {payload.manageableItemCount}건
                </div>
              </motion.div>

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
                    <motion.div key={item.key} {...staggeredFadeUpMotion(index + 8, reduceMotion)}>
                      <BoardScheduleManageCard
                        event={item.event}
                        manageable={true}
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
        </main>

        {payload.canCreate ? (
          <button
            type="button"
            aria-label="캘린더 항목 만들기"
            onClick={() => setShowEventCreateModal(true)}
            className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-transform active:scale-95 ${
              mode === "user" && payload.admin ? "bottom-40" : "bottom-24"
            }`}
            style={{
              boxShadow:
                mode === "admin"
                  ? "0 6px 16px rgba(249, 115, 22, 0.32)"
                  : "0 6px 16px rgba(19, 91, 236, 0.32)",
            }}
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
