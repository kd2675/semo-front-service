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
  pinnedOnly: boolean;
  onPinnedOnlyChange: (next: boolean) => void;
  onReload: () => void;
};

export function ClubNoticeHomeClient({
  clubId,
  payload,
  mode = "user",
  pinnedOnly,
  onPinnedOnlyChange,
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
          {mode === "user" ? (
            <>
              <section className="px-4 pt-6">
                <motion.div className="mb-4" {...staggeredFadeUpMotion(4, reduceMotion)}>
                  <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                      <h3 className="shrink-0 rounded-lg border border-[var(--primary)]/15 bg-[var(--primary)]/[0.08] px-3 py-1.5 text-sm font-bold tracking-[-0.02em] text-[var(--primary)] shadow-sm">
                        내 게시글
                      </h3>
                      <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                          type="button"
                          aria-pressed={!pinnedOnly}
                          onClick={() => onPinnedOnlyChange(false)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            pinnedOnly ? "text-slate-500 hover:text-slate-700" : "bg-[var(--primary)] text-white"
                          }`}
                        >
                          전체
                        </button>
                        <button
                          type="button"
                          aria-pressed={pinnedOnly}
                          onClick={() => onPinnedOnlyChange(true)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            pinnedOnly ? "bg-[var(--primary)] text-white" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          핀 고정
                        </button>
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-bold text-[var(--primary)]">
                      {payload.manageableNoticeCount}건
                    </div>
                  </div>
                </motion.div>

                <div className="space-y-5 pb-4">
                  {payload.notices.length === 0 ? (
                    <motion.div
                      className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-500"
                      {...staggeredFadeUpMotion(5, reduceMotion)}
                    >
                      {pinnedOnly ? "핀 고정 게시글이 없습니다." : "관리 가능한 게시글이 없습니다."}
                    </motion.div>
                  ) : (
                    payload.notices.map((notice, index) => (
                      <motion.div key={notice.noticeId} {...staggeredFadeUpMotion(index + 5, reduceMotion)}>
                        <NoticeManageCard
                          notice={notice}
                          canEdit={notice.canEdit}
                          canDelete={notice.canDelete}
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
                </div>
              </section>
            </>
          ) : null}
        </main>

        {payload.canCreate ? (
          <button
            type="button"
            aria-label="게시글 작성"
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
