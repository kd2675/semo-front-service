"use client";

import { motion, useReducedMotion } from "motion/react";

type ScheduleManageCardProps = {
  label: string;
  manageable: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
};

export function ScheduleManageCard({
  label,
  manageable,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
  children,
}: ScheduleManageCardProps) {
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
        aria-label={manageable ? `${label} 작업 열기` : `${label} 자세히 보기`}
        className="relative z-10 block w-full bg-white text-left transition-colors hover:bg-slate-50"
      >
        {children}
        {manageable ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-2">
            <span className="pointer-events-none absolute inset-y-0 right-1 w-0.5 bg-amber-500/90" />
            <span className="pointer-events-none absolute inset-y-0 right-0.5 w-0.5 bg-rose-500/90" />
          </div>
        ) : null}
      </button>

      {manageable ? (
        <div
          className="absolute inset-0 z-20"
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
              aria-label={`${label} 작업 닫기`}
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
              aria-label={`${label} 자세히 보기`}
              className="flex min-w-0 flex-[2] flex-col items-center justify-center gap-2 border-r border-white/40 bg-white/78 px-4 text-center text-sm font-bold text-slate-900 transition hover:bg-white/90"
              initial={false}
              animate={
                open
                  ? { opacity: 1, y: 0 }
                  : reduceMotion
                    ? { opacity: 0, y: 0 }
                    : { opacity: 0, y: 14 }
              }
              transition={{
                duration: reduceMotion ? 0.1 : 0.24,
                ease: "easeOut",
                delay: open && !reduceMotion ? 0.02 : 0,
              }}
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
              aria-label={`${label} 수정`}
              className="flex flex-1 flex-col items-center justify-center gap-2 border-r border-white/40 bg-amber-500/84 px-2 text-[11px] font-bold text-white transition hover:bg-amber-500/94"
              initial={false}
              animate={
                open
                  ? { opacity: 1, x: 0 }
                  : reduceMotion
                    ? { opacity: 0, x: 0 }
                    : { opacity: 0, x: 14 }
              }
              transition={{
                duration: reduceMotion ? 0.1 : 0.24,
                ease: "easeOut",
                delay: open && !reduceMotion ? 0.05 : 0,
              }}
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
              aria-label={`${label} 삭제`}
              className="flex flex-1 flex-col items-center justify-center gap-2 bg-rose-500/84 px-2 text-[11px] font-bold text-white transition hover:bg-rose-500/94"
              initial={false}
              animate={
                open
                  ? { opacity: 1, x: 0 }
                  : reduceMotion
                    ? { opacity: 0, x: 0 }
                    : { opacity: 0, x: 18 }
              }
              transition={{
                duration: reduceMotion ? 0.1 : 0.22,
                ease: "easeOut",
                delay: open && !reduceMotion ? 0.08 : 0,
              }}
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
