"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ClubNoticeListItem } from "@/app/lib/clubs";
import { getLinkedContentBadge, getShareTargetBadges } from "@/app/lib/content-badge";

type NoticeManageCardProps = {
  notice: ClubNoticeListItem;
  readCount?: number;
  canEdit: boolean;
  canDelete: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenReadStatus?: () => void;
  showBoardShareBadge?: boolean;
};

export function NoticeManageCard({
  notice,
  readCount = 0,
  canEdit,
  canDelete,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
  onOpenReadStatus,
  showBoardShareBadge = false,
}: NoticeManageCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const manageable = canEdit || canDelete;
  const metaDateLabel = notice.publishedAtLabel || notice.timeAgo;
  const metaAuthorLabel = notice.authorDisplayName;
  const metaAuthorAvatarUrl = notice.authorAvatarThumbnailUrl ?? notice.authorAvatarImageUrl;
  const badge = getLinkedContentBadge(notice.linkedTargetType);
  const shareBadges = getShareTargetBadges({
    postedToBoard: notice.postedToBoard,
    postedToCalendar: notice.postedToCalendar,
    includeBoard: showBoardShareBadge,
  });

  return (
    <div className="relative overflow-visible rounded-[8px] border border-slate-100 bg-white shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        aria-label={`${notice.title} 자세히 보기`}
        className="block cursor-pointer text-left transition-colors hover:bg-slate-50"
      >
        <article>
          {notice.imageUrl ? (
            <div className="relative h-40 w-full overflow-hidden rounded-t-[8px] bg-slate-100">
              <Image
                src={notice.imageUrl}
                alt={notice.title}
                fill
                sizes="(max-width: 768px) 100vw, 448px"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${badge.className}`}>
                  {badge.label}
                </span>
                {notice.pinned ? (
                  <span className="rounded bg-red-50 px-2 py-0.5 text-[11px] font-bold uppercase text-red-600">
                    고정
                  </span>
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
              <span className="shrink-0 text-xs text-slate-400">{metaDateLabel}</span>
            </div>
            <h2 className="mb-2 line-clamp-1 text-base font-bold text-slate-900">{notice.title}</h2>
            <p className="line-clamp-2 text-sm leading-6 text-slate-500">{notice.summary}</p>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  {metaAuthorAvatarUrl ? (
                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-100">
                      <Image
                        src={metaAuthorAvatarUrl}
                        alt={metaAuthorLabel}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-bold text-[var(--primary)]">
                      {metaAuthorLabel.slice(0, 1)}
                    </div>
                  )}
                  <p className="min-w-0 truncate text-sm font-semibold text-slate-600">{metaAuthorLabel}</p>
                </div>
                {onOpenReadStatus ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
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
                    aria-label={`${notice.title} 관리 메뉴`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenChange(!open);
                    }}
                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                  </button>

                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: reduceMotion ? 0.1 : 0.16, ease: "easeOut" }}
                        className="absolute right-0 top-10 z-30 w-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
                      >
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
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
                            onClick={(event) => {
                              event.stopPropagation();
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
        </article>
      </div>
    </div>
  );
}
