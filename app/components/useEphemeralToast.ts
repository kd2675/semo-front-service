"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EphemeralToastTone } from "@/app/components/EphemeralToast";

type ToastState = {
  id: number;
  message: string;
  tone: EphemeralToastTone;
} | null;

export function useEphemeralToast(durationMs = 2000) {
  const [toast, setToast] = useState<ToastState>(null);
  const nextToastIdRef = useRef(1);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, durationMs);

    return () => window.clearTimeout(timeoutId);
  }, [durationMs, toast]);

  const showToast = useCallback((message: string, tone: EphemeralToastTone = "success") => {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      return;
    }

    setToast({
      id: nextToastIdRef.current,
      message: normalizedMessage,
      tone,
    });
    nextToastIdRef.current += 1;
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    clearToast,
  };
}
