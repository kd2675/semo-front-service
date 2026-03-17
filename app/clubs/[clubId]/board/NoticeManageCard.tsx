"use client";

import { motion, useReducedMotion } from "motion/react";
import { getNoticeAccentClasses } from "@/app/lib/notice-category";
import type { ClubNoticeListItem } from "@/app/lib/clubs";

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
  const accent = getNoticeAccentClasses(notice.categoryAccentTone);
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <div className="relative overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => {
          if (manageable) {
            onOpenChange(!open);
            return;
          }
          onOpen();
        }}
        aria-label={manageable ? `${notice.title} 작업 열기` : `${notice.title} 자세히 보기`}
        className="relative z-10 flex w-full gap-4 bg-white px-4 py-5 pr-7 text-left transition-colors hover:bg-slate-50"
      >
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${accent.icon}`}>
          <span className="material-symbols-outlined">{notice.categoryIconName}</span>
        </div>
        <div className="min-w-0 flex flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-base font-bold leading-snug text-slate-900">{notice.title}</p>
            <span className="whitespace-nowrap text-xs text-slate-400">{notice.timeAgo}</span>
          </div>
          <p className="line-clamp-2 text-sm text-slate-600">{notice.summary}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex size-5 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)]/20">
              <span className="material-symbols-outlined text-[12px] text-[var(--primary)]">person</span>
            </div>
            <p className="text-xs font-semibold text-[var(--primary)]">{notice.authorDisplayName}</p>
          </div>
        </div>
        {manageable ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 w-2">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-1 w-0.5 bg-amber-500/90" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0.5 w-0.5 bg-rose-500/90" />
          </div>
        ) : null}
      </button>

      {manageable ? (
        <div
          className="absolute inset-y-0 left-4 right-4 z-20 overflow-hidden"
          onClick={() => onOpenChange(false)}
          style={{ pointerEvents: open ? "auto" : "none" }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/24 backdrop-blur-[2px]"
            initial={false}
            animate={open ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: "easeOut" }}
          />
          <div className="absolute inset-0 flex items-stretch">
          <motion.button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenChange(false);
            }}
            aria-label={`${notice.title} 작업 닫기`}
            className="flex flex-1 flex-col items-center justify-center gap-2 border-r border-white/40 bg-slate-900/40 px-2 text-[11px] font-bold text-white transition hover:bg-slate-900/55"
            initial={false}
            animate={
              open
                ? { opacity: 1, x: 0 }
                : reduceMotion
                  ? { opacity: 0, x: 0 }
                  : { opacity: 0, x: -14 }
            }
            transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: "easeOut" }}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
            닫기
          </motion.button>
          <motion.button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            aria-label={`${notice.title} 자세히 보기`}
            className="flex min-w-0 flex-[2] flex-col items-center justify-center gap-2 border-r border-white/40 bg-white/78 px-4 text-center text-sm font-bold text-slate-900 transition hover:bg-white/90"
            initial={false}
            animate={
              open
                ? { opacity: 1, y: 0 }
                : reduceMotion
                  ? { opacity: 0, y: 0 }
                  : { opacity: 0, y: 14 }
            }
            transition={{ duration: reduceMotion ? 0.1 : 0.24, ease: "easeOut", delay: open && !reduceMotion ? 0.02 : 0 }}
          >
            <span className="material-symbols-outlined text-[24px]">article</span>
            자세히 보기
          </motion.button>
          <motion.button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            aria-label={`${notice.title} 수정`}
            className="flex flex-1 flex-col items-center justify-center gap-2 border-r border-white/40 bg-amber-500/84 px-2 text-[11px] font-bold text-white transition hover:bg-amber-500/94"
            initial={false}
            animate={
              open
                ? { opacity: 1, x: 0 }
                : reduceMotion
                  ? { opacity: 0, x: 0 }
                  : { opacity: 0, x: 14 }
            }
            transition={{ duration: reduceMotion ? 0.1 : 0.24, ease: "easeOut", delay: open && !reduceMotion ? 0.05 : 0 }}
          >
            <span className="material-symbols-outlined text-[22px]">edit</span>
            수정
          </motion.button>
          <motion.button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            aria-label={`${notice.title} 삭제`}
            className="flex flex-1 flex-col items-center justify-center gap-2 bg-rose-500/84 px-2 text-[11px] font-bold text-white transition hover:bg-rose-500/94"
            initial={false}
            animate={
              open
                ? { opacity: 1, x: 0 }
                : reduceMotion
                  ? { opacity: 0, x: 0 }
                  : { opacity: 0, x: 18 }
            }
            transition={{ duration: reduceMotion ? 0.1 : 0.22, ease: "easeOut", delay: open && !reduceMotion ? 0.08 : 0 }}
          >
            <span className="material-symbols-outlined text-[22px]">delete</span>
            삭제
          </motion.button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
