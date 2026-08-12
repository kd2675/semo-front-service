"use client";

import type { ReactNode } from "react";

import { RouteModal } from "@/app/components/RouteModal";

type ScheduleActionConfirmModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  busy?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  iconName?: string;
  tone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
};

export function ScheduleActionConfirmModal({
  title,
  description,
  confirmLabel,
  busyLabel,
  busy = false,
  confirmDisabled = false,
  children,
  iconName = "delete",
  tone = "danger",
  onCancel,
  onConfirm,
}: ScheduleActionConfirmModalProps) {
  return (
    <RouteModal ariaLabel={title} onDismiss={onCancel} contentClassName="max-w-[22rem] rounded-[1.75rem] sm:rounded-[1.75rem]">
      <div className="bg-white px-5 py-5">
        <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl ${tone === "danger" ? "bg-rose-50 text-rose-500" : "bg-[var(--primary)]/10 text-[var(--primary)]"}`}>
          <span className="material-symbols-outlined text-[24px]" aria-hidden="true">{iconName}</span>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        {children ? <div className="mt-5">{children}</div> : null}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${tone === "danger" ? "bg-rose-500 hover:bg-rose-600" : "bg-[var(--primary)] hover:brightness-95"}`}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </RouteModal>
  );
}
