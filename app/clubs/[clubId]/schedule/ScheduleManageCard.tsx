"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type ScheduleManageCardProps = {
  label: string;
  canEdit: boolean;
  canDelete: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  variant?: "overlay" | "menu";
  children: React.ReactNode;
};

export function ScheduleManageCard({
  label,
  canEdit,
  canDelete,
  open,
  onOpenChange,
  onOpen,
  onEdit,
  onDelete,
  variant = "overlay",
  children,
}: ScheduleManageCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const manageable = canEdit || canDelete;

  if (variant === "menu") {
    return (
      <div className="relative overflow-visible bg-white">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${label} 자세히 보기`}
          className="block w-full bg-white text-left transition-colors hover:bg-slate-50"
        >
          {children}
        </button>

        {manageable ? (
          <div className="relative border-t border-slate-50 px-2">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenChange(!open);
                }}
                aria-label={`${label} 관리 메뉴`}
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
    );
  }

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

            {canEdit ? (
              <motion.button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
                aria-label={`${label} 수정`}
                className={`flex flex-1 flex-col items-center justify-center gap-2 bg-amber-500/84 px-2 text-[11px] font-bold text-white transition hover:bg-amber-500/94 ${
                  canDelete ? "border-r border-white/40" : ""
                }`}
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
            ) : null}

            {canDelete ? (
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
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
