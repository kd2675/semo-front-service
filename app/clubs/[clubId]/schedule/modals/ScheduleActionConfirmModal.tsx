"use client";

import { RouteModal } from "@/app/components/RouteModal";

type ScheduleActionConfirmModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ScheduleActionConfirmModal({
  title,
  description,
  confirmLabel,
  busyLabel,
  busy = false,
  onCancel,
  onConfirm,
}: ScheduleActionConfirmModalProps) {
  return (
    <RouteModal onDismiss={onCancel} contentClassName="max-w-[22rem] rounded-[1.75rem] sm:rounded-[1.75rem]">
      <div className="bg-white px-5 py-5">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <span className="material-symbols-outlined text-[24px]">delete</span>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
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
            disabled={busy}
            className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-60"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </RouteModal>
  );
}
