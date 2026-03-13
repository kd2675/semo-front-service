"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { overlayFadeMotion, popInMotion } from "@/app/lib/motion";

type RouteModalProps = {
  children: React.ReactNode;
  onDismiss: () => void;
  dismissOnBackdrop?: boolean;
  contentClassName?: string;
};

export function RouteModal({
  children,
  onDismiss,
  dismissOnBackdrop = true,
  contentClassName,
}: RouteModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      onDismiss();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <motion.button
        type="button"
        aria-label={dismissOnBackdrop ? "모달 닫기" : "모달 배경"}
        className="absolute inset-0 cursor-default bg-slate-950/40 backdrop-blur-sm"
        onClick={dismissOnBackdrop ? onDismiss : undefined}
        {...overlayFadeMotion(reduceMotion)}
      />
      <motion.section
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-visible border border-white/70 bg-[rgba(248,250,255,0.96)] shadow-[0_32px_120px_rgba(15,23,42,0.28)] rounded-t-[2.25rem] rounded-b-none sm:rounded-t-[2.25rem] sm:rounded-b-none ${contentClassName ?? ""}`}
        onClick={(event) => {
          event.stopPropagation();
        }}
        {...popInMotion(reduceMotion)}
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(19,91,236,0.12),transparent)]" />
          {children}
        </div>
      </motion.section>
    </div>
  );
}
