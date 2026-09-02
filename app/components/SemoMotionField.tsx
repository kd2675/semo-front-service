"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { motion, useMotionValue, useScroll, useSpring } from "motion/react";

import { useHydrationSafeReducedMotion } from "@/app/hooks/useHydrationSafeReducedMotion";

const FLOATING_TRIANGLES = [
  { className: "semo-motion-triangle semo-motion-triangle-one", size: 210 },
  { className: "semo-motion-triangle semo-motion-triangle-two", size: 132 },
  { className: "semo-motion-triangle semo-motion-triangle-three", size: 86 },
] as const;

export function SemoMotionField() {
  const pathname = usePathname();
  const prefersReducedMotion = useHydrationSafeReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothPointerX = useSpring(pointerX, { stiffness: 90, damping: 24, mass: 0.6 });
  const smoothPointerY = useSpring(pointerY, { stiffness: 90, damping: 24, mass: 0.6 });
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 170,
    damping: 28,
    mass: 0.25,
  });
  const tone = pathname?.includes("/admin") ? "admin" : "user";

  useEffect(() => {
    if (prefersReducedMotion) {
      pointerX.set(0);
      pointerY.set(0);
      return;
    }

    const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!precisePointer.matches) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      pointerX.set(event.clientX - window.innerWidth / 2);
      pointerY.set(event.clientY - window.innerHeight / 2);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [pointerX, pointerY, prefersReducedMotion]);

  return (
    <>
      <motion.div
        className="semo-scroll-progress"
        data-tone={tone}
        style={{ scaleX: prefersReducedMotion ? scrollYProgress : progress }}
        aria-hidden="true"
      />
      <div
        className="semo-motion-field"
        data-tone={tone}
        data-reduced-motion={prefersReducedMotion ? "true" : "false"}
        aria-hidden="true"
      >
        <div className="semo-motion-grid" />
        <div className="semo-motion-beam semo-motion-beam-one" />
        <div className="semo-motion-beam semo-motion-beam-two" />
        <motion.div
          className="semo-motion-pointer"
          style={{ x: smoothPointerX, y: smoothPointerY }}
        />
        {FLOATING_TRIANGLES.map((triangle, index) => (
          <motion.svg
            key={triangle.className}
            viewBox="0 0 100 88"
            className={triangle.className}
            style={{ width: triangle.size, height: triangle.size }}
            initial={false}
            animate={
              prefersReducedMotion
                ? { opacity: 0.28 }
                : {
                    y: index === 1 ? [0, 12, 0] : [0, -14, 0],
                    rotate: index === 2 ? [0, 5, 0] : [0, -4, 0],
                    opacity: [0.18, 0.34, 0.18],
                  }
            }
            transition={{
              duration: 12 + index * 4,
              repeat: prefersReducedMotion ? 0 : Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: index * 0.8,
            }}
          >
            <path d="M50 5 95 83H5L50 5Z" />
            <path d="m50 25 27 47H23l27-47Z" />
          </motion.svg>
        ))}
      </div>
    </>
  );
}
