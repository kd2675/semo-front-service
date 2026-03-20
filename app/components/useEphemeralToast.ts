"use client";

import { useCallback, useEffect, useState } from "react";
import type { EphemeralToastTone } from "@/app/components/EphemeralToast";

type ToastState = {
  message: string;
  tone: EphemeralToastTone;
} | null;

export function useEphemeralToast(durationMs = 2000) {
  const [toast, setToast] = useState<ToastState>(null);

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
    setToast({ message, tone });
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
