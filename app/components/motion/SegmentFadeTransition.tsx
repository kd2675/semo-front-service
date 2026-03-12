"use client";

import { motion, useReducedMotion } from "motion/react";
import { pageTransitionMotion } from "@/app/lib/motion";

type SegmentFadeTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SegmentFadeTransition({
  children,
  className,
}: SegmentFadeTransitionProps) {
  const prefersReducedMotion = useReducedMotion();
  const reduceMotion = Boolean(prefersReducedMotion);

  return (
    <motion.div className={className} {...pageTransitionMotion(reduceMotion)}>
      {children}
    </motion.div>
  );
}
