"use client";

import { useSyncExternalStore } from "react";

import { useReducedMotion } from "motion/react";

const subscribeToHydration = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Motion's media-query value can differ between SSR and the browser's first
 * render. Delay that value until hydration completes so reduced-motion users
 * do not receive mismatched markup or a flash of animated state.
 */
export function useHydrationSafeReducedMotion(): boolean {
  const prefersReducedMotion = useReducedMotion();
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  return isHydrated && Boolean(prefersReducedMotion);
}
