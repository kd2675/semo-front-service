"use client";

import { useEffect, useEffectEvent } from "react";
import {
  isTokenExpired,
  scheduleTokenExpiry,
} from "@/app/lib/auth";
import {
  selectAuthHydrated,
  selectAuthIsRestoring,
  selectAuthStatus,
  selectAuthUser,
  setHydrated,
  syncSession,
} from "@/app/store/authSlice";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { onAuthChanged } from "@/app/lib/authEvents";

export default function useAuthSession() {
  const dispatch = useAppDispatch();
  const isHydrated = useAppSelector(selectAuthHydrated);
  const isRestoring = useAppSelector(selectAuthIsRestoring);
  const authStatus = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectAuthUser);

  const syncSessionNow = useEffectEvent(() => {
    void dispatch(syncSession());
  });

  const handleResume = useEffectEvent(() => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }

    syncSessionNow();
  });

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      dispatch(setHydrated(true));
    });
    syncSessionNow();

    const unsubscribe = onAuthChanged(() => {
      syncSessionNow();
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
  }, [dispatch]);

  useEffect(() => {
    const userExp = user?.exp;
    if (!userExp) {
      return;
    }

    if (isTokenExpired(userExp)) {
      let cancelled = false;
      void (async () => {
        if (cancelled) {
          return;
        }
        await dispatch(syncSession());
      })();
      return () => {
        cancelled = true;
      };
    }

    return scheduleTokenExpiry(() => {
      void dispatch(syncSession());
    }, userExp);
  }, [dispatch, user?.exp]);

  return {
    isHydrated,
    authStatus: isRestoring ? "unknown" : authStatus,
    user,
  };
}
