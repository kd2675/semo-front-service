"use client";

import { motion } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";

type SemoSwitchProps = {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  tone?: "user" | "admin";
  className?: string;
};

/**
 * A 44px touch target with a deliberately smaller visual track.
 * The state change uses transform-only motion and remains stable for SSR and
 * reduced-motion users.
 */
export function SemoSwitch({
  checked,
  label,
  onCheckedChange,
  disabled = false,
  tone,
  className,
}: SemoSwitchProps) {
  const reduceMotion = useHydrationSafeReducedMotion();
  const activeColor = tone === "admin" ? "var(--color-admin-primary)" : "var(--primary)";

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-11 w-14 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-45 ${className ?? ""}`}
      whileTap={disabled || reduceMotion ? undefined : { scale: 0.94 }}
    >
      <span
        className="absolute h-6 w-11 rounded-full border border-black/5 shadow-inner transition-colors duration-200"
        style={{ backgroundColor: checked ? activeColor : "var(--color-line)" }}
        aria-hidden="true"
      />
      <motion.span
        className="absolute left-2.5 size-5 rounded-full border border-black/5 bg-white shadow-sm"
        initial={false}
        animate={{ x: checked ? 20 : 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 520, damping: 34, mass: 0.55 }
        }
        aria-hidden="true"
      />
    </motion.button>
  );
}
