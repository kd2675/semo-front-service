"use client";

import { startTransition, useEffect, useEffectEvent } from "react";
import {
  bootstrapAccessToken,
  clearAccessToken,
  getAccessToken,
  getUserFromToken,
  isTokenExpired,
  notifyAuthExpired,
  refreshAccessToken,
  scheduleTokenExpiry,
} from "@/app/lib/auth";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  setAuthSnapshot,
  setHydrated,
  setRestoring,
  type AuthStatus,
} from "@/app/redux/slices/auth-slice";
import type { AuthUser } from "@/app/types/auth";

export default function useAuthSession() {
  const dispatch = useAppDispatch();
  const { status, user, isHydrated, isRestoring } = useAppSelector((state) => state.auth);

  const readSnapshot = (): { status: AuthStatus; user: AuthUser | null } => {
    if (typeof window === "undefined") {
      return { status: "unknown", user: null };
    }

    const token = getAccessToken();
    if (!token) {
      return { status: "out", user: null };
    }

    const user = getUserFromToken(token);
    if (!user) {
      return { status: "out", user: null };
    }

    if (user.exp && isTokenExpired(user.exp)) {
      return { status: "out", user: null };
    }

    return { status: "in", user };
  };

  const commitSnapshot = useEffectEvent((restoring: boolean) => {
    const nextSnapshot = readSnapshot();
    startTransition(() => {
      dispatch(setAuthSnapshot(nextSnapshot));
      dispatch(setRestoring(restoring));
    });
  });

  const syncSession = useEffectEvent(async () => {
    const token = getAccessToken();
    if (!token) {
      await bootstrapAccessToken();
      commitSnapshot(false);
      return;
    }

    const user = getUserFromToken(token);
    if (!user) {
      clearAccessToken();
      await bootstrapAccessToken();
      commitSnapshot(false);
      return;
    }

    if (user.exp && isTokenExpired(user.exp)) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        clearAccessToken();
        notifyAuthExpired("refresh_failed");
      }
      commitSnapshot(false);
      return;
    }

    commitSnapshot(false);
  });

  const handleResume = useEffectEvent(() => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    void syncSession();
  });

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      dispatch(setHydrated());
    });
    void syncSession();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleResume();
      }
    };

    window.addEventListener("focus", handleResume);
    window.addEventListener("pageshow", handleResume);
    window.addEventListener("online", handleResume);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("pageshow", handleResume);
      window.removeEventListener("online", handleResume);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dispatch]);

  useEffect(() => {
    const userExp = user?.exp;
    if (!userExp) {
      return;
    }

    if (isTokenExpired(userExp)) {
      let cancelled = false;
      void (async () => {
        const refreshed = await refreshAccessToken();
        if (cancelled) {
          return;
        }

        if (!refreshed) {
          clearAccessToken();
          notifyAuthExpired("refresh_failed");
        }
        commitSnapshot(false);
      })();
      return () => {
        cancelled = true;
      };
    }

    return scheduleTokenExpiry(() => {
      void (async () => {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          clearAccessToken();
          notifyAuthExpired("refresh_failed");
        }
        commitSnapshot(false);
      })();
    }, userExp);
  }, [user?.exp]);

  return {
    isHydrated,
    authStatus: isRestoring ? "unknown" : status,
    user,
  };
}
