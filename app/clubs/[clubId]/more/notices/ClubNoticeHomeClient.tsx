"use client";

import { RouteModal } from "@/app/components/RouteModal";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubNoticeDetailModal, ClubPollDetailModal, ClubScheduleEventDetailModal } from "@/app/components/ClubDetailModals";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import { getNoticeAccentClasses } from "@/app/lib/notice-category";
import {
  deleteClubNotice,
  type ClubNoticeHomeResponse,
  type ClubNoticeListItem,
  type ClubScheduleEventSummary,
  type ClubScheduleVoteSummary,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { startTransition, useDeferredValue, useMemo, useState, type CSSProperties } from "react";
import { ClubNoticeEditorClient } from "../../board/ClubNoticeEditorClient";

type ClubNoticeHomeClientProps = {
  clubId: string;
  payload: ClubNoticeHomeResponse;
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

function UserNoticeCard({
  notice,
  manageable,
  menuOpen,
  onMenuChange,
  onOpen,
  onEdit,
  onDelete,
}: {
  notice: ClubNoticeListItem;
  manageable: boolean;
  menuOpen: boolean;
  onMenuChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const accent = getNoticeAccentClasses(notice.categoryAccentTone);
  const metaDateLabel = notice.publishedAtLabel || notice.timeAgo;

  return (
    <article className="relative overflow-visible rounded-[8px] border border-slate-100 bg-white shadow-sm">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        {notice.imageUrl ? (
          <>
            <div className="relative h-40 w-full overflow-hidden">
              <Image
                src={notice.imageUrl}
                alt={notice.title}
                fill
                sizes="(max-width: 768px) 100vw, 448px"
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${accent.badge}`}>
                  {notice.categoryLabel}
                </span>
                <span className="text-xs text-slate-400">{metaDateLabel}</span>
              </div>
              <h2 className="mb-2 line-clamp-1 text-base font-bold text-slate-900">{notice.title}</h2>
              <p className="line-clamp-2 text-sm leading-6 text-slate-500">{notice.summary}</p>
            </div>
          </>
        ) : (
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${accent.badge}`}>
                {notice.categoryLabel}
              </span>
              <span className="text-xs text-slate-400">{metaDateLabel}</span>
            </div>
            <h2 className="mb-2 line-clamp-1 text-base font-bold text-slate-900">{notice.title}</h2>
            <p className="line-clamp-2 text-sm leading-6 text-slate-500">{notice.summary}</p>
          </div>
        )}
      </button>

      {manageable ? (
        <div className="relative border-t border-slate-50 px-2">
          <div className="flex items-center justify-end">
            <button
              type="button"
              aria-label={`${notice.title} 관리 메뉴`}
              onClick={(event) => {
                event.stopPropagation();
                onMenuChange(!menuOpen);
              }}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {menuOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="absolute bottom-12 right-4 z-20 w-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMenuChange(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-amber-600 transition hover:bg-amber-50"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  수정
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onMenuChange(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  삭제
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </article>
  );
}

function getSharedEventSecondaryText(event: ClubScheduleEventSummary) {
  const parts = [event.dateLabel, event.timeLabel, event.locationLabel].filter(Boolean);
  return parts.length > 0 ? parts.join(" • ") : "세부 안내 없음";
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

export function ClubNoticeHomeClient({
  clubId,
  payload,
  mode = "user",
  onReload,
}: ClubNoticeHomeClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailNoticeId, setDetailNoticeId] = useState<string | null>(null);
  const [sharedEventDetailId, setSharedEventDetailId] = useState<string | null>(null);
  const [sharedVoteDetailId, setSharedVoteDetailId] = useState<string | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubNoticeListItem | null>(null);
  const [activeMenuNoticeId, setActiveMenuNoticeId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const accent = mode === "admin" ? "#f97316" : "#135bec";
  const background = mode === "admin" ? "#f6f6f8" : "#f6f6f8";
  const basePath = mode === "admin" ? `/clubs/${clubId}/admin/more/notices` : `/clubs/${clubId}/more/notices`;
  const sharedEvents = payload.sharedEvents ?? [];
  const sharedVotes = payload.sharedVotes ?? [];

  const filteredNotices = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return payload.notices;
    }
    return payload.notices.filter((notice) =>
      `${notice.title} ${notice.summary} ${notice.categoryLabel} ${notice.authorDisplayName}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [deferredQuery, payload.notices]);

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    const result = await deleteClubNotice(clubId, deleteTarget.noticeId);
    setDeleting(false);
    if (!result.ok) {
      return;
    }

    setDeleteTarget(null);
    onReload();
  };

  return (
    <div
      className="min-h-full bg-[var(--background-light)] font-display text-slate-900"
      style={{ "--primary": accent, "--background-light": background } as CSSProperties}
    >
      <div className="relative mx-auto flex min-h-full max-w-md flex-col bg-[var(--background-light)]">
        <ClubPageHeader
          title="공지 관리"
          subtitle={payload.clubName}
          icon="campaign"
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
                    <h2 className="text-lg font-bold">공지 현황</h2>
                    <p className="mt-1 text-sm text-slate-500">최근 등록된 공지와 핵심 지표를 한 번에 봅니다.</p>
                  </div>
                  <span className="text-sm font-medium text-[var(--primary)]">실시간</span>
                </motion.div>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div {...staggeredFadeUpMotion(1, reduceMotion)}>
                    <AdminMetricsCard label="전체 공지" value={payload.totalNoticeCount} icon="campaign" accent={accent} />
                  </motion.div>
                  <motion.div {...staggeredFadeUpMotion(2, reduceMotion)}>
                    <AdminMetricsCard label="오늘 게시" value={payload.publishedTodayCount} icon="today" accent={accent} />
                  </motion.div>
                  <motion.div {...staggeredFadeUpMotion(3, reduceMotion)}>
                    <AdminMetricsCard label="상단 고정" value={payload.pinnedNoticeCount} icon="keep" accent={accent} />
                  </motion.div>
                  <motion.div {...staggeredFadeUpMotion(4, reduceMotion)}>
                    <AdminMetricsCard label="일정 연결" value={payload.scheduledNoticeCount} icon="calendar_month" accent={accent} />
                  </motion.div>
                </div>
              </section>

            </>
          ) : (
            <>
              <section className="px-4 pt-6 pb-2">
                <motion.h2 className="text-2xl font-bold text-slate-900" {...staggeredFadeUpMotion(0, reduceMotion)}>
                  공지 관리
                </motion.h2>
                <motion.p className="mt-1 text-sm text-slate-500" {...staggeredFadeUpMotion(1, reduceMotion)}>
                  작성한 공지를 카드형 화면에서 바로 확인하고 관리합니다.
                </motion.p>
              </section>

              <motion.section
                className="hide-scrollbar flex gap-3 overflow-x-auto px-4 py-2"
                {...staggeredFadeUpMotion(2, reduceMotion)}
              >
                <MetricsCard label="전체" value={payload.totalNoticeCount} accent={accent} />
                <MetricsCard label="오늘 게시" value={payload.publishedTodayCount} accent={accent} highlighted />
                <MetricsCard label="상단 고정" value={payload.pinnedNoticeCount} accent={accent} />
                <MetricsCard label="일정 연결" value={payload.scheduledNoticeCount} accent={accent} />
              </motion.section>

              <section className="mt-6 px-4">
                <motion.div className="mb-4 flex items-center justify-between" {...staggeredFadeUpMotion(3, reduceMotion)}>
                  <div>
                    <h3 className="text-lg font-bold">내 공지</h3>
                    <p className="mt-1 text-sm text-slate-500">카드를 누르면 바로 상세를 보고, 점 세 개 버튼으로 수정과 삭제를 합니다.</p>
                  </div>
                  <div className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                    {payload.manageableNoticeCount}건
                  </div>
                </motion.div>

                <motion.div className="mb-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
                  <div className="flex gap-2">
                    <label className="block flex-1">
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
                          placeholder="제목 또는 내용 검색"
                          type="text"
                        />
                      </div>
                    </label>
                    <button
                      type="button"
                      aria-label="필터"
                      className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-slate-600 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[20px]">tune</span>
                    </button>
                  </div>
                </motion.div>

                <div className="space-y-5 pb-4">
                  {filteredNotices.length === 0 ? (
                    <motion.div
                      className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500"
                      {...staggeredFadeUpMotion(5, reduceMotion)}
                    >
                      관리 가능한 공지가 없습니다.
                    </motion.div>
                  ) : (
                    filteredNotices.map((notice, index) => (
                      <motion.div key={notice.noticeId} {...staggeredFadeUpMotion(index + 5, reduceMotion)}>
                        <UserNoticeCard
                          notice={notice}
                          manageable={notice.canManage}
                          menuOpen={activeMenuNoticeId === notice.noticeId}
                          onMenuChange={(open) => setActiveMenuNoticeId(open ? notice.noticeId : null)}
                          onOpen={() => {
                            setActiveMenuNoticeId(null);
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
                            setActiveMenuNoticeId(null);
                            setEditingNoticeId(String(notice.noticeId));
                          }}
                          onDelete={() => {
                            setActiveMenuNoticeId(null);
                            setDeleteTarget(notice);
                          }}
                        />
                      </motion.div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

          {sharedEvents.length > 0 || sharedVotes.length > 0 ? (
            <section className="px-4 pb-8">
              <motion.div className="mb-4 flex items-center justify-between" {...staggeredFadeUpMotion(28, reduceMotion)}>
                <div>
                  <h3 className="text-lg font-bold">일정/투표 공유 항목</h3>
                  <p className="mt-1 text-sm text-slate-500">공지 화면에서 함께 보여줄 공유 데이터를 확인합니다.</p>
                </div>
                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-bold text-[var(--primary)]">
                  {sharedEvents.length + sharedVotes.length}건
                </span>
              </motion.div>

              {sharedEvents.length > 0 ? (
                <motion.div className="mb-6 space-y-3" {...staggeredFadeUpMotion(29, reduceMotion)}>
                  <h4 className="text-sm font-bold text-slate-700">공유 일정</h4>
                  {sharedEvents.map((event) => (
                    <button
                      type="button"
                      key={`shared-event-${event.eventId}`}
                      onClick={() => setSharedEventDetailId(String(event.eventId))}
                      className="block w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[var(--primary)]/50"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="rounded bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-bold uppercase text-[var(--primary)]">
                          일정
                        </span>
                        <span className="text-xs text-slate-400">{event.timeLabel ?? event.dateLabel}</span>
                      </div>
                      <p className="line-clamp-1 text-sm font-bold text-slate-900">{event.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{getSharedEventSecondaryText(event)}</p>
                    </button>
                  ))}
                </motion.div>
              ) : null}

              {sharedVotes.length > 0 ? (
                <motion.div className="space-y-3" {...staggeredFadeUpMotion(30, reduceMotion)}>
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

        {payload.canCreate ? (
          <button
            type="button"
            aria-label="공지 작성"
            onClick={() => setShowCreateModal(true)}
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
            <span className="material-symbols-outlined text-[28px]">edit_square</span>
          </button>
        ) : null}

        {mode === "user" && payload.admin ? <ClubModeSwitchFab clubId={clubId} mode="user" /> : null}

        <AnimatePresence>
          {showCreateModal ? (
            <RouteModal onDismiss={() => setShowCreateModal(false)} dismissOnBackdrop={false}>
              <ClubNoticeEditorClient
                clubId={clubId}
                presentation="modal"
                basePath={basePath}
                onRequestClose={() => setShowCreateModal(false)}
                onSaved={(savedNoticeId) => {
                  setShowCreateModal(false);
                  onReload();
                  setDetailNoticeId(String(savedNoticeId));
                }}
              />
            </RouteModal>
          ) : null}

          {detailNoticeId ? (
            <ClubNoticeDetailModal
              clubId={clubId}
              noticeId={detailNoticeId}
              mode={mode}
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
              mode={mode}
              onRequestClose={() => setSharedVoteDetailId(null)}
            />
          ) : null}

          {editingNoticeId ? (
            <RouteModal onDismiss={() => setEditingNoticeId(null)} dismissOnBackdrop={false}>
              <ClubNoticeEditorClient
                clubId={clubId}
                noticeId={editingNoticeId}
                presentation="modal"
                basePath={basePath}
                onRequestClose={() => setEditingNoticeId(null)}
                onSaved={(savedNoticeId) => {
                  setEditingNoticeId(null);
                  onReload();
                  setDetailNoticeId(String(savedNoticeId));
                }}
                onDeleted={() => {
                  setEditingNoticeId(null);
                  onReload();
                }}
              />
            </RouteModal>
          ) : null}
        </AnimatePresence>

        {deleteTarget ? (
          <ScheduleActionConfirmModal
            title="공지를 삭제할까요?"
            description={`‘${deleteTarget.title}’ 공지와 연결된 일정 데이터가 함께 정리될 수 있습니다.`}
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
