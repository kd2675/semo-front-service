"use client";

import { RouteModal } from "@/app/components/RouteModal";
import { ClubModeSwitchFab } from "@/app/components/ClubModeSwitchFab";
import { ClubPageHeader } from "@/app/components/ClubPageHeader";
import { ClubNoticeDetailModal } from "@/app/components/ClubDetailModals";
import { ScheduleActionConfirmModal } from "@/app/clubs/[clubId]/schedule/ScheduleActionConfirmModal";
import {
  deleteClubNotice,
  type ClubNoticeHomeResponse,
  type ClubNoticeListItem,
} from "@/app/lib/clubs";
import { staggeredFadeUpMotion } from "@/app/lib/motion";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type CSSProperties } from "react";
import { ClubNoticeEditorClient } from "../../board/ClubNoticeEditorClient";
import { NoticeManageCard } from "../../board/NoticeManageCard";

type ClubNoticeHomeClientProps = {
  clubId: string;
  payload: ClubNoticeHomeResponse;
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

export function ClubNoticeHomeClient({
  clubId,
  payload,
  mode = "user",
  onReload,
}: ClubNoticeHomeClientProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailNoticeId, setDetailNoticeId] = useState<string | null>(null);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClubNoticeListItem | null>(null);
  const [activeMenuNoticeId, setActiveMenuNoticeId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const accent = mode === "admin" ? "#f97316" : "#135bec";
  const background = mode === "admin" ? "#f6f6f8" : "#f6f6f8";
  const basePath = mode === "admin" ? `/clubs/${clubId}/admin/more/notices` : `/clubs/${clubId}/more/notices`;
  const latestNotice = payload.notices[0] ?? null;
  const visibleNotices = payload.notices;

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
          <section className="px-4 pt-6">
            {mode === "admin" ? (
              <motion.div className="mb-6 space-y-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
                <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_55%,#fff1e7_100%)] p-6 shadow-[0_18px_50px_rgba(249,115,22,0.12)] ring-1 ring-orange-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="max-w-[70%]">
                      <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-orange-500">
                        Notice Control
                      </p>
                      <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">공지 운영 현황</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        작성된 공지 수, 고정 비율, 예약 발행 상태를 기준으로 현재 공지 운영 밀도를 확인합니다.
                      </p>
                    </div>
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-3xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                      <span className="material-symbols-outlined text-[30px]">campaign</span>
                    </div>
                  </div>
                  <div className="mt-5 rounded-[24px] bg-white/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">가장 최근 공지</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">
                      {latestNotice ? latestNotice.title : "아직 작성된 공지가 없습니다."}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {latestNotice
                        ? `${latestNotice.authorDisplayName} · ${latestNotice.timeAgo}`
                        : "첫 공지를 작성하면 여기서 가장 최근 발행 상태를 바로 확인할 수 있습니다."}
                    </p>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-3">
                  <AdminInsightTile
                    icon="article"
                    label="전체 공지"
                    value={payload.totalNoticeCount.toLocaleString("ko-KR")}
                    detail={`운영자가 관리 가능한 공지 ${payload.manageableNoticeCount.toLocaleString("ko-KR")}건`}
                  />
                  <AdminInsightTile
                    icon="push_pin"
                    label="고정 공지"
                    value={payload.pinnedNoticeCount.toLocaleString("ko-KR")}
                    detail="중요 공지로 상단에 유지되는 항목 수"
                  />
                  <AdminInsightTile
                    icon="calendar_month"
                    label="캘린더 공유"
                    value={payload.scheduledNoticeCount.toLocaleString("ko-KR")}
                    detail="캘린더에도 함께 노출되는 공지 수"
                  />
                  <AdminInsightTile
                    icon="today"
                    label="오늘 발행"
                    value={payload.publishedTodayCount.toLocaleString("ko-KR")}
                    detail="오늘 새로 게시된 공지 수"
                  />
                </div>
              </motion.div>
            ) : null}

            {mode === "admin" ? null : (
            <motion.div className="mb-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold tracking-[-0.02em] text-slate-900">내 게시글</h3>
                <div className="shrink-0 text-sm font-bold text-[var(--primary)]">
                  {payload.manageableNoticeCount.toLocaleString("ko-KR")}건
                </div>
              </div>
            </motion.div>
            )}

            {mode === "admin" ? null : (
            <div className="space-y-5 pb-4">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">최근 게시글</h2>
                </div>

              {visibleNotices.length === 0 ? (
                <motion.div
                  className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500"
                  {...staggeredFadeUpMotion(6, reduceMotion)}
                >
                  관리 가능한 게시글이 없습니다.
                </motion.div>
              ) : (
                visibleNotices.map((notice, index) => (
                  <motion.div
                    key={notice.noticeId}
                    {...staggeredFadeUpMotion(index + 6, reduceMotion)}
                    className={activeMenuNoticeId === notice.noticeId ? "relative z-20" : "relative"}
                  >
                    <NoticeManageCard
                      notice={notice}
                      canEdit={notice.canEdit}
                      canDelete={notice.canDelete}
                      showBoardShareBadge
                      open={activeMenuNoticeId === notice.noticeId}
                      onOpenChange={(open) => setActiveMenuNoticeId(open ? notice.noticeId : null)}
                      onOpen={() => {
                        setActiveMenuNoticeId(null);
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
              </section>
            </div>
            )}
          </section>
        </main>

        {payload.canCreate && mode !== "admin" ? (
          <button
            type="button"
            aria-label="게시글 작성"
            onClick={() => setShowCreateModal(true)}
            className={`fixed right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-transform active:scale-95 ${
              mode === "user" && payload.admin ? "bottom-40" : "bottom-24"
            }`}
            style={{ boxShadow: "0 6px 16px rgba(19, 91, 236, 0.32)" }}
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
            title="게시글을 삭제할까요?"
            description={`‘${deleteTarget.title}’ 게시글은 삭제 후 복구할 수 없습니다.`}
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
