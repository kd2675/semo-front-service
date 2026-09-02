"use client";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { toastMotion } from "@/app/lib/motion";
import type { ToastItem } from "@/app/redux/slices/modalSlice";

function getToastToneStyles(tone: ToastItem["tone"]) {
  switch (tone) {
    case "error":
      return {
        icon: "error",
        label: "오류",
        railClassName: "bg-rose-500",
        iconClassName: "bg-rose-50 text-rose-700",
        actionClassName: "text-rose-700 hover:bg-rose-50",
      };
    case "warning":
      return {
        icon: "warning",
        label: "주의",
        railClassName: "bg-amber-500",
        iconClassName: "bg-amber-50 text-amber-700",
        actionClassName: "text-amber-700 hover:bg-amber-50",
      };
    case "info":
      return {
        icon: "info",
        label: "안내",
        railClassName: "bg-sky-500",
        iconClassName: "bg-sky-50 text-sky-700",
        actionClassName: "text-sky-700 hover:bg-sky-50",
      };
    default:
      return {
        icon: "check_circle",
        label: "완료",
        railClassName: "bg-emerald-500",
        iconClassName: "bg-emerald-50 text-emerald-700",
        actionClassName: "text-emerald-700 hover:bg-emerald-50",
      };
  }
}

type BasicToastProps = {
  toast: ToastItem;
  onAction: () => void;
  onClose: () => void;
};

export function BasicToast({
  toast,
  onAction,
  onClose,
}: BasicToastProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const styles = getToastToneStyles(toast.tone);

  return (
    <motion.div
      role={toast.tone === "error" ? "alert" : "status"}
      aria-live={toast.tone === "error" ? "assertive" : "polite"}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+6.5rem)] z-[85] flex justify-center px-4 sm:bottom-6 sm:justify-end"
      {...toastMotion(reduceMotion)}
    >
      <div className="pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-[var(--radius-card)] border border-slate-200 bg-white/96 p-4 shadow-[var(--shadow-floating)] backdrop-blur-xl">
        <span className={`absolute inset-y-0 left-0 w-1 ${styles.railClassName}`} />
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${styles.iconClassName}`}>
          <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{styles.icon}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-slate-400">{styles.label}</span>
          {toast.title ? <span className="mt-0.5 block text-sm font-black text-slate-900">{toast.title}</span> : null}
          <span className="mt-0.5 block whitespace-pre-wrap text-sm leading-5 text-slate-600">{toast.message}</span>
          {toast.actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className={`mt-2 min-h-11 rounded-[var(--radius-control)] px-2 text-xs font-black transition ${styles.actionClassName}`}
            >
              {toast.actionLabel}
            </button>
          ) : null}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="semo-icon-control -mr-2 -mt-2 shrink-0 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="알림 닫기"
        >
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
        </button>
        <motion.span
          className={`absolute bottom-0 left-0 h-1 ${styles.railClassName}`}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: reduceMotion ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : toast.durationMs / 1000, ease: "linear" }}
          style={{ width: "100%", transformOrigin: "0 50%" }}
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
}

export const basicToast = BasicToast;
