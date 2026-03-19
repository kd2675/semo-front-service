"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ClubNoticeListItem } from "@/app/lib/clubs";
import { getLinkedContentBadge } from "@/app/lib/content-badge";

type NoticeManageCardProps = {
  notice: ClubNoticeListItem;
  manageable: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function NoticeManageCard({
  notice,
  manageable,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
}: NoticeManageCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const metaDateLabel = notice.publishedAtLabel || notice.timeAgo;
  const badge = getLinkedContentBadge(notice.linkedTargetType);

  return (
    <div className="relative overflow-visible rounded-[8px] border border-slate-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${notice.title} 자세히 보기`}
        className="block w-full text-left transition-colors hover:bg-slate-50"
      >
        <article className="overflow-hidden">
          {notice.imageUrl ? (
            <>
              <div className="relative h-40 w-full bg-slate-100">
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
                  <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${badge.className}`}>
                    {badge.label}
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
                <span className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${badge.className}`}>
                  {badge.label}
                </span>
                <span className="shrink-0 text-xs text-slate-400">{metaDateLabel}</span>
              </div>
              <h2 className="mb-2 line-clamp-1 text-base font-bold text-slate-900">{notice.title}</h2>
              <p className="line-clamp-2 text-sm leading-6 text-slate-500">{notice.summary}</p>
            </div>
          )}
        </article>
      </button>

      {manageable ? (
        <div className="relative border-t border-slate-50 px-2">
          <div className="flex items-center justify-end">
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
          </div>

          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: reduceMotion ? 0.1 : 0.16, ease: "easeOut" }}
                className="absolute bottom-12 right-4 z-20 w-28 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
              >
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
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenChange(false);
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
    </div>
  );
}
