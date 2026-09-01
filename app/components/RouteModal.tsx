"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";
import { overlayFadeMotion, popInMotion } from "@/app/lib/motion";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type RouteModalProps = {
  children: React.ReactNode;
  onDismiss: () => void;
  dismissOnBackdrop?: boolean;
  dismissOnEscape?: boolean;
  contentClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
};

export function RouteModal({
  children,
  onDismiss,
  dismissOnBackdrop = true,
  dismissOnEscape = true,
  contentClassName,
  ariaLabel = "대화상자",
  ariaLabelledBy,
}: RouteModalProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const dialogRef = useRef<HTMLElement | null>(null);
  const dismiss = useEffectEvent(onDismiss);
  const canDismissWithEscape = useEffectEvent(() => dismissOnEscape);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;

    const focusFrame = window.requestAnimationFrame(() => {
      const firstFocusable = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? dialog)?.focus({ preventScroll: true });
    });

    const isTopmostDialog = () => {
      const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]');
      return dialogs.item(dialogs.length - 1) === dialog;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!dialog || !isTopmostDialog()) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (canDismissWithEscape()) {
          dismiss();
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((element) => element.getAttribute("aria-hidden") !== "true");
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;
      if (event.shiftKey && (activeElement === first || !dialog.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-sm"
        onClick={dismissOnBackdrop ? onDismiss : undefined}
        {...overlayFadeMotion(reduceMotion)}
      />
      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabelledBy ? undefined : ariaLabel}
        aria-labelledby={ariaLabelledBy}
        tabIndex={-1}
        data-route-modal
        className={`relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-visible border border-white/70 bg-[rgba(248,250,255,0.96)] shadow-[var(--shadow-modal)] rounded-t-[var(--radius-modal)] rounded-b-none sm:rounded-[var(--radius-modal)] ${contentClassName ?? ""}`}
        onClick={(event) => {
          event.stopPropagation();
        }}
        {...popInMotion(reduceMotion)}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
          <div className="semo-modal-accent pointer-events-none absolute inset-x-0 top-0 h-20" />
          {children}
        </div>
      </motion.section>
    </div>
  );
}
