"use client";

import { useCallback } from "react";
import { clearModalCallbacks } from "@/app/redux/modalCallbackRegistry";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import { addToast, deleteToast, type ToastTone } from "@/app/redux/slices/modalSlice";

export function useAppToast(durationMs = 2000) {
  const dispatch = useAppDispatch();
  const currentToast = useAppSelector((state) => state.modal.toast[0] ?? null);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      return;
    }

    dispatch(addToast({
      message: normalizedMessage,
      tone,
      durationMs,
    }));
  }, [dispatch, durationMs]);

  const clearToast = useCallback(() => {
    if (!currentToast) {
      return;
    }

    clearModalCallbacks(currentToast.id);
    dispatch(deleteToast(currentToast.id));
  }, [currentToast, dispatch]);

  return {
    showToast,
    clearToast,
  };
}
