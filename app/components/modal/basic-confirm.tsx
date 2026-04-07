"use client";

import { RouteModal } from "@/app/components/RouteModal";
import type { ConfirmItem } from "@/app/redux/slices/modal-slice";

function getConfirmToneStyles(tone: ConfirmItem["tone"]) {
  switch (tone) {
    case "danger":
      return {
        icon: "delete",
        eyebrow: "DANGER ACTION",
        shellClassName: "border-rose-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,241,242,0.96))]",
        iconWrapClassName: "bg-rose-600 text-white shadow-[0_18px_32px_rgba(225,29,72,0.24)]",
        confirmButtonClassName: "bg-rose-600 text-white hover:bg-rose-700",
        footerClassName: "bg-rose-50/70",
      };
    case "warning":
      return {
        icon: "warning",
        eyebrow: "WARNING ACTION",
        shellClassName: "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,237,0.96))]",
        iconWrapClassName: "bg-amber-500 text-white shadow-[0_18px_32px_rgba(217,119,6,0.22)]",
        confirmButtonClassName: "bg-amber-500 text-white hover:bg-amber-600",
        footerClassName: "bg-amber-50/70",
      };
    case "success":
      return {
        icon: "check_circle",
        eyebrow: "CONFIRM ACTION",
        shellClassName: "border-emerald-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(236,253,245,0.96))]",
        iconWrapClassName: "bg-emerald-500 text-white shadow-[0_18px_32px_rgba(5,150,105,0.22)]",
        confirmButtonClassName: "bg-emerald-600 text-white hover:bg-emerald-700",
        footerClassName: "bg-emerald-50/70",
      };
    default:
      return {
        icon: "help",
        eyebrow: "DECISION REQUIRED",
        shellClassName: "border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]",
        iconWrapClassName: "bg-[var(--primary)] text-white shadow-[0_18px_32px_rgba(249,115,22,0.22)]",
        confirmButtonClassName: "bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90",
        footerClassName: "bg-slate-100/90",
      };
  }
}

type BasicConfirmProps = {
  confirm: ConfirmItem;
  onCancel: () => void;
  onConfirm: () => void;
};

export function BasicConfirm({
  confirm,
  onCancel,
  onConfirm,
}: BasicConfirmProps) {
  const styles = getConfirmToneStyles(confirm.tone);

  return (
    <RouteModal
      onDismiss={onCancel}
      dismissOnBackdrop={confirm.dismissOnBackdrop}
      contentClassName="max-w-[22.5rem] rounded-[2rem] border-0 bg-transparent p-0 shadow-none sm:rounded-[2rem]"
    >
      <div className={`overflow-hidden rounded-[2rem] border shadow-[0_34px_90px_rgba(15,23,42,0.22)] ${styles.shellClassName}`}>
        <div className="relative px-5 pb-6 pt-4">
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_70%)]" />
          <div className="relative flex items-center justify-between gap-3">
            <span className="text-[10px] font-black tracking-[0.24em] text-slate-500">{styles.eyebrow}</span>
            <button
              type="button"
              onClick={onCancel}
              aria-label="확인창 닫기"
              className="inline-flex size-9 items-center justify-center rounded-full border border-black/5 bg-white/80 text-slate-400 transition-colors hover:text-slate-700"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="relative mt-4 text-center">
            <div className={`mx-auto flex size-15 items-center justify-center rounded-[1.3rem] ${styles.iconWrapClassName}`}>
              <span className="material-symbols-outlined text-[30px]">{styles.icon}</span>
            </div>
            <h3 className="mt-4 text-[1.24rem] font-black tracking-tight text-slate-950">{confirm.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{confirm.message}</p>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              취소 또는 확인을 선택하세요
            </p>
          </div>
        </div>

        <div className={`grid grid-cols-2 gap-3 px-5 pb-5 pt-4 ${styles.footerClassName}`}>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[1.1rem] border border-white/80 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
          >
            {confirm.cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-[1.1rem] px-4 py-3 text-sm font-black tracking-[0.01em] shadow-sm transition-colors ${styles.confirmButtonClassName}`}
          >
            {confirm.confirmLabel}
          </button>
        </div>
      </div>
    </RouteModal>
  );
}

export const basicConfirm = BasicConfirm;
