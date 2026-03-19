"use client";

import { useEffect, useRef, useState } from "react";

type UseBottomNavScrollDockingOptions = {
  routeKey: string;
  bottomDockThresholdPx?: number;
  scrollDetectDeltaPx?: number;
};

const DEFAULT_BOTTOM_DOCK_THRESHOLD_PX = 180;
const DEFAULT_SCROLL_DETECT_DELTA_PX = 4;
const NON_SCROLLABLE_CONTENT_EPSILON_PX = 2;

export function useBottomNavScrollDocking({
  routeKey,
  bottomDockThresholdPx = DEFAULT_BOTTOM_DOCK_THRESHOLD_PX,
  scrollDetectDeltaPx = DEFAULT_SCROLL_DETECT_DELTA_PX,
}: UseBottomNavScrollDockingOptions) {
  const [isDocked, setIsDocked] = useState(true);
  const initialScrollYRef = useRef(0);
  const hasDetectedScrollRef = useRef(false);

  useEffect(() => {
    let rafId = 0;

    const resetDockingState = () => {
      initialScrollYRef.current = window.scrollY ?? 0;
      hasDetectedScrollRef.current = false;
      setIsDocked(true);
    };

    const recalcDocking = () => {
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY ?? 0;
      const contentHeight = document.documentElement.scrollHeight;
      const maxScrollTop = contentHeight - viewportHeight;
      const hasScrollableContent = maxScrollTop > NON_SCROLLABLE_CONTENT_EPSILON_PX;
      const nearBottom = scrollTop + viewportHeight >= contentHeight - bottomDockThresholdPx;

      if (!hasScrollableContent) {
        setIsDocked(true);
        return;
      }

      if (!hasDetectedScrollRef.current) {
        const movedEnough = Math.abs(scrollTop - initialScrollYRef.current) >= scrollDetectDeltaPx;
        if (!movedEnough) {
          setIsDocked(true);
          return;
        }
        hasDetectedScrollRef.current = true;
      }

      setIsDocked(nearBottom);
    };

    const onScrollOrResize = () => {
      cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(recalcDocking);
    };

    resetDockingState();
    recalcDocking();

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [routeKey, bottomDockThresholdPx, scrollDetectDeltaPx]);

  return isDocked;
}
