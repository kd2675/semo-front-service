"use client";

import { motion, useReducedMotion } from "motion/react";
import type { NotiItem } from "@/app/redux/slices/modalSlice";

function getNotiToneStyles(tone: NotiItem["tone"]) {
  switch (tone) {
    case "danger":
      return {
        icon: "release_alert",
        railClassName: "bg-rose-500",
        shellClassName: "border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,241,242,0.96))]",
        iconWrapClassName: "bg-rose-50 text-rose-600",
        actionButtonClassName: "bg-rose-600 text-white hover:bg-rose-700",
      };
    case "warning":
      return {
        icon: "warning",
        railClassName: "bg-amber-500",
        shellClassName: "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,237,0.96))]",
        iconWrapClassName: "bg-amber-50 text-amber-600",
        actionButtonClassName: "bg-amber-500 text-white hover:bg-amber-600",
      };
    case "success":
      return {
        icon: "task_alt",
        railClassName: "bg-emerald-500",
        shellClassName: "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,253,245,0.96))]",
        iconWrapClassName: "bg-emerald-50 text-emerald-600",
        actionButtonClassName: "bg-emerald-600 text-white hover:bg-emerald-700",
      };
    case "info":
      return {
        icon: "notifications_active",
        railClassName: "bg-sky-500",
        shellClassName: "border-sky-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,249,255,0.96))]",
        iconWrapClassName: "bg-sky-50 text-sky-600",
        actionButtonClassName: "bg-sky-600 text-white hover:bg-sky-700",
      };
    default:
      return {
        icon: "notifications",
        railClassName: "bg-slate-900",
        shellClassName: "border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]",
        iconWrapClassName: "bg-slate-100 text-slate-700",
        actionButtonClassName: "bg-slate-900 text-white hover:bg-slate-800",
      };
  }
}

type BasicNotiProps = {
  notification: NotiItem;
  onAction: () => void;
  onClose: () => void;
};

export function BasicNoti({
  notification,
  onAction,
  onClose,
}: BasicNotiProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const styles = getNotiToneStyles(notification.tone);

  return (
    <motion.div
      key={notification.id}
      className={`pointer-events-auto relative overflow-hidden rounded-[1.55rem] border shadow-[0_22px_52px_rgba(15,23,42,0.14)] backdrop-blur-xl ${styles.shellClassName}`}
      initial={reduceMotion ? false : { opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.98 }}
      transition={{ duration: reduceMotion ? 0.08 : 0.22, ease: "easeOut" }}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${styles.railClassName}`} />
      <div className="flex items-start gap-3 px-4 py-4">
        <div className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[1rem] ${styles.iconWrapClassName}`}>
          <span className="material-symbols-outlined text-[20px]">{styles.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-[0.22em] text-slate-400">NOTI</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[11px] font-semibold text-slate-400">SEMO</span>
              </div>
              <p className="mt-1 text-sm font-black tracking-tight text-slate-900">{notification.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {notification.message}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-9 items-center justify-center rounded-full border border-black/5 bg-white/75 text-slate-400 transition-colors hover:text-slate-700"
              aria-label="알림 닫기"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          {notification.actionLabel ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={onAction}
                className={`rounded-full px-3 py-1.5 text-xs font-black tracking-[0.03em] transition-colors ${styles.actionButtonClassName}`}
              >
                {notification.actionLabel}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

export const basicNoti = BasicNoti;
