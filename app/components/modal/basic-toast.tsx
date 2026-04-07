"use client";

import type { ComponentType } from "react";
import { Progress } from "@material-tailwind/react";
import { RouteModal } from "@/app/components/RouteModal";
import type { ToastItem } from "@/app/redux/slices/modal-slice";

type SafeProgressProps = {
  value: number;
  variant?: "filled" | "gradient";
  size?: "sm" | "md" | "lg";
  className?: string;
  barProps?: {
    className?: string;
  };
};

const SafeProgress = Progress as unknown as ComponentType<SafeProgressProps>;

function getToastToneStyles(tone: ToastItem["tone"]) {
  switch (tone) {
    case "error":
      return {
        icon: "error",
        eyebrow: "ERROR FEEDBACK",
        shellClassName: "border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,241,242,0.94))]",
        iconWrapClassName: "bg-rose-600 text-white shadow-[0_16px_32px_rgba(225,29,72,0.28)]",
        progressClassName: "from-rose-500 via-rose-400 to-rose-300",
        actionButtonClassName: "bg-rose-600 text-white hover:bg-rose-700",
        badgeClassName: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
      };
    case "warning":
      return {
        icon: "warning",
        eyebrow: "WARNING FEEDBACK",
        shellClassName: "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,237,0.94))]",
        iconWrapClassName: "bg-amber-500 text-white shadow-[0_16px_32px_rgba(217,119,6,0.24)]",
        progressClassName: "from-amber-500 via-amber-400 to-amber-300",
        actionButtonClassName: "bg-amber-500 text-white hover:bg-amber-600",
        badgeClassName: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      };
    case "info":
      return {
        icon: "info",
        eyebrow: "INFO FEEDBACK",
        shellClassName: "border-sky-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,249,255,0.94))]",
        iconWrapClassName: "bg-sky-500 text-white shadow-[0_16px_32px_rgba(2,132,199,0.24)]",
        progressClassName: "from-sky-500 via-sky-400 to-cyan-300",
        actionButtonClassName: "bg-sky-600 text-white hover:bg-sky-700",
        badgeClassName: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
      };
    default:
      return {
        icon: "check_circle",
        eyebrow: "SUCCESS FEEDBACK",
        shellClassName: "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,253,245,0.94))]",
        iconWrapClassName: "bg-emerald-500 text-white shadow-[0_16px_32px_rgba(5,150,105,0.24)]",
        progressClassName: "from-emerald-500 via-emerald-400 to-lime-300",
        actionButtonClassName: "bg-emerald-600 text-white hover:bg-emerald-700",
        badgeClassName: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      };
  }
}

type BasicToastProps = {
  progress: number;
  toast: ToastItem;
  onAction: () => void;
  onClose: () => void;
};

export function BasicToast({
  progress,
  toast,
  onAction,
  onClose,
}: BasicToastProps) {
  const styles = getToastToneStyles(toast.tone);
  const hasAction = Boolean(toast.actionLabel);
  const progressLabel = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <RouteModal
      onDismiss={onClose}
      dismissOnBackdrop={false}
      contentClassName="max-w-[25rem] rounded-[2rem] border-0 bg-transparent p-0 shadow-none sm:rounded-[2rem]"
    >
      <div className={`relative overflow-hidden rounded-[2rem] border shadow-[0_34px_90px_rgba(15,23,42,0.2)] ${styles.shellClassName}`}>
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_70%)]" />
        <div className="relative px-5 pb-5 pt-4">
          <div className="flex items-start justify-between gap-3">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.22em] ${styles.badgeClassName}`}>
              {styles.eyebrow}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="토스트 닫기"
              className="inline-flex size-9 items-center justify-center rounded-full border border-black/5 bg-white/80 text-slate-400 transition-colors hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <div className={`mx-auto flex size-14 items-center justify-center rounded-[1.25rem] ${styles.iconWrapClassName}`}>
              <span className="material-symbols-outlined text-[28px]">{styles.icon}</span>
            </div>
            {toast.title ? <h3 className="mt-4 text-[1.15rem] font-black tracking-tight text-slate-950">{toast.title}</h3> : null}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{toast.message}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              자동으로 닫히기 전까지 확인할 수 있습니다
            </p>
          </div>
        </div>

        <div className="px-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-black tracking-[0.18em] text-slate-400">
              AUTO CLOSE
            </span>
            <span className="text-xs font-black tabular-nums text-slate-500">
              {progressLabel}%
            </span>
          </div>
          <SafeProgress
            value={progressLabel}
            variant="gradient"
            size="lg"
            className="h-3 rounded-full bg-slate-200/90 ring-1 ring-black/5"
            barProps={{
              className: `rounded-full bg-gradient-to-r ${styles.progressClassName}`,
            }}
          />
        </div>

        <div className={`mt-5 grid gap-3 bg-white/72 px-5 pb-5 pt-4 ${hasAction ? "grid-cols-2" : "grid-cols-1"}`}>
          <div
            className={`${hasAction ? "" : "hidden"}`}
          >
            {hasAction ? (
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                닫기
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={hasAction ? onAction : onClose}
            className={`w-full rounded-[1.1rem] px-4 py-3 text-sm font-black tracking-[0.01em] transition-colors ${hasAction ? styles.actionButtonClassName : "bg-slate-900 text-white hover:bg-slate-800"}`}
          >
            {toast.actionLabel ?? "확인"}
          </button>
        </div>
      </div>
    </RouteModal>
  );
}

export const basicToast = BasicToast;
