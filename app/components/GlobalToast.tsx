"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { hideToast } from "@/app/store/uiSlice";

const TOAST_DURATION_MS = 2000;

const TONE_CLASSNAME = {
  success: "bg-emerald-500 text-white shadow-[0_18px_40px_rgba(16,185,129,0.28)]",
  error: "bg-rose-500 text-white shadow-[0_18px_40px_rgba(244,63,94,0.28)]",
  info: "bg-slate-900 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]",
} as const;

export function GlobalToast() {
  const dispatch = useAppDispatch();
  const { toastOpen, toastMessage, toastTone, toastId } = useAppSelector(
    (state) => state.ui,
  );
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  useEffect(() => {
    if (!toastOpen) return;

    const timeoutId = window.setTimeout(() => {
      dispatch(hideToast());
    }, TOAST_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [toastOpen, toastId, dispatch]);

  return (
    <AnimatePresence initial={false}>
      {toastOpen && toastMessage ? (
        <motion.div
          key={toastId}
          className="pointer-events-none fixed inset-x-0 top-5 z-[80] flex justify-center px-4"
          initial={reduceMotion ? false : { opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: reduceMotion ? 0.08 : 0.2, ease: "easeOut" }}
        >
          <div
            className={`max-w-[min(90vw,32rem)] rounded-full px-4 py-2 text-sm font-semibold ${TONE_CLASSNAME[toastTone]}`}
          >
            {toastMessage}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
