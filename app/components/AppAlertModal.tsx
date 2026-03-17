"use client";

import { RouteModal } from "@/app/components/RouteModal";
import type { AppAlertState } from "@/app/hooks/useAppAlert";

type AppAlertModalProps = {
  open: boolean;
  title: string;
  message: string;
  tone?: AppAlertState["tone"];
  confirmLabel?: string;
  onClose: () => void;
};

function getToneStyles(tone: AppAlertState["tone"]) {
  switch (tone) {
    case "danger":
      return {
        iconWrapClassName: "bg-rose-50 text-rose-500",
        icon: "error",
        buttonClassName: "bg-rose-500 hover:bg-rose-600",
      };
    case "warning":
      return {
        iconWrapClassName: "bg-amber-50 text-amber-500",
        icon: "warning",
        buttonClassName: "bg-amber-500 hover:bg-amber-600",
      };
    default:
      return {
        iconWrapClassName: "bg-[var(--primary)]/10 text-[var(--primary)]",
        icon: "info",
        buttonClassName: "bg-[var(--primary)] hover:bg-[var(--primary)]/90",
      };
  }
}

export function AppAlertModal({
  open,
  title,
  message,
  tone = "default",
  confirmLabel = "확인",
  onClose,
}: AppAlertModalProps) {
  if (!open) {
    return null;
  }

  const styles = getToneStyles(tone);

  return (
    <RouteModal onDismiss={onClose} contentClassName="max-w-[22rem] rounded-[1.75rem] sm:rounded-[1.75rem]">
      <div className="bg-white px-5 py-5">
        <div
          className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl ${styles.iconWrapClassName}`}
        >
          <span className="material-symbols-outlined text-[24px]">{styles.icon}</span>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">{message}</p>
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors ${styles.buttonClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </RouteModal>
  );
}
