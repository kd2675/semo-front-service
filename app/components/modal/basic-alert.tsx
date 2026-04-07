"use client";

import { motion, useReducedMotion } from "motion/react";
import type { AlertItem } from "@/app/redux/slices/modal-slice";

function getAlertToneStyles(tone: AlertItem["tone"]) {
  switch (tone) {
    case "danger":
      return {
        icon: "error",
        label: "CRITICAL",
        panelClassName: "border-rose-200/80 bg-[linear-gradient(135deg,rgba(255,241,242,0.96),rgba(255,255,255,0.96))] text-rose-950 shadow-[0_22px_52px_rgba(225,29,72,0.18)]",
        iconWrapClassName: "bg-rose-600 text-white shadow-[0_12px_24px_rgba(225,29,72,0.24)]",
        glowClassName: "bg-[radial-gradient(circle,rgba(251,113,133,0.28),transparent_72%)]",
      };
    case "warning":
      return {
        icon: "warning",
        label: "CAUTION",
        panelClassName: "border-amber-200/80 bg-[linear-gradient(135deg,rgba(255,247,237,0.96),rgba(255,255,255,0.96))] text-amber-950 shadow-[0_22px_52px_rgba(217,119,6,0.18)]",
        iconWrapClassName: "bg-amber-500 text-white shadow-[0_12px_24px_rgba(217,119,6,0.22)]",
        glowClassName: "bg-[radial-gradient(circle,rgba(251,191,36,0.3),transparent_72%)]",
      };
    case "success":
      return {
        icon: "check_circle",
        label: "SUCCESS",
        panelClassName: "border-emerald-200/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.96))] text-emerald-950 shadow-[0_22px_52px_rgba(5,150,105,0.18)]",
        iconWrapClassName: "bg-emerald-500 text-white shadow-[0_12px_24px_rgba(5,150,105,0.22)]",
        glowClassName: "bg-[radial-gradient(circle,rgba(52,211,153,0.3),transparent_72%)]",
      };
    case "info":
      return {
        icon: "info",
        label: "NOTICE",
        panelClassName: "border-sky-200/80 bg-[linear-gradient(135deg,rgba(240,249,255,0.96),rgba(255,255,255,0.96))] text-sky-950 shadow-[0_22px_52px_rgba(2,132,199,0.18)]",
        iconWrapClassName: "bg-sky-500 text-white shadow-[0_12px_24px_rgba(2,132,199,0.22)]",
        glowClassName: "bg-[radial-gradient(circle,rgba(56,189,248,0.26),transparent_72%)]",
      };
    default:
      return {
        icon: "campaign",
        label: "SYSTEM",
        panelClassName: "border-slate-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.96),rgba(255,255,255,0.98))] text-slate-900 shadow-[0_22px_52px_rgba(15,23,42,0.12)]",
        iconWrapClassName: "bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.2)]",
        glowClassName: "bg-[radial-gradient(circle,rgba(59,130,246,0.16),transparent_72%)]",
      };
  }
}

type BasicAlertProps = {
  alert: AlertItem;
};

export function BasicAlert({ alert }: BasicAlertProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);
  const styles = getAlertToneStyles(alert.tone);

  return (
    <motion.div
      key={alert.id}
      className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex justify-center px-4"
      initial={reduceMotion ? false : { opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: reduceMotion ? 0.08 : 0.22, ease: "easeOut" }}
    >
      <div
        role="alert"
        className={`relative flex w-full max-w-[min(92vw,42rem)] items-start gap-3 overflow-hidden rounded-[1.6rem] border px-4 py-3.5 backdrop-blur-xl ${styles.panelClassName}`}
      >
        <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl ${styles.glowClassName}`} />
        <div className={`relative mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-[1.05rem] ${styles.iconWrapClassName}`}>
          <span className="material-symbols-outlined text-[22px]">{styles.icon}</span>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-[0.24em] opacity-70">{styles.label}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-30" />
            <span className="text-[11px] font-semibold opacity-60">SEMO</span>
          </div>
          {alert.title ? <p className="mt-1 text-sm font-bold tracking-tight">{alert.title}</p> : null}
          <p className="mt-0.5 whitespace-pre-wrap text-sm leading-5 opacity-85">{alert.message}</p>
        </div>
      </div>
    </motion.div>
  );
}

export const basicAlert = BasicAlert;
