"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";
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
import { onAuthChanged } from "@/app/lib/authEvents";
import type { AuthUser } from "@/app/types/auth";

type AuthStatus = "unknown" | "in" | "out";

export default function useAuthSession() {
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

  const [snapshot, setSnapshot] = useState(readSnapshot);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  const commitSnapshot = useEffectEvent((restoring: boolean) => {
    const nextSnapshot = readSnapshot();
    startTransition(() => {
      setSnapshot(nextSnapshot);
      setIsRestoring(restoring);
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
    const frameId = window.requestAnimationFrame(() => setIsHydrated(true));
    void syncSession();

    const unsubscribe = onAuthChanged(() => {
      startTransition(() => {
        setSnapshot(readSnapshot());
        setIsRestoring(false);
      });
    });

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
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userExp = snapshot.user?.exp;
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
  }, [snapshot.user?.exp]);

  return {
    isHydrated,
    authStatus: isRestoring ? "unknown" : snapshot.status,
    user: snapshot.user,
  };
}
