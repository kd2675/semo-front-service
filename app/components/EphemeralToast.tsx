"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export type EphemeralToastTone = "success" | "error" | "info";

type EphemeralToastProps = {
  message: string | null;
  tone?: EphemeralToastTone;
};

const TONE_CLASSNAME: Record<EphemeralToastTone, string> = {
  success: "bg-emerald-500 text-white shadow-[0_18px_40px_rgba(16,185,129,0.28)]",
  error: "bg-rose-500 text-white shadow-[0_18px_40px_rgba(244,63,94,0.28)]",
  info: "bg-slate-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]",
};

export function EphemeralToast({
  message,
  tone = "success",
}: EphemeralToastProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.div
          key={message}
          className="pointer-events-none fixed inset-x-0 top-5 z-[80] flex justify-center px-4"
          initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0.08 : 0.2, ease: "easeOut" }}
        >
          <div
            className={`max-w-[min(90vw,32rem)] rounded-full px-4 py-2 text-sm font-semibold ${TONE_CLASSNAME[tone]}`}
          >
            {message}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
