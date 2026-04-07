"use client";

import { useAppDispatch } from "@/app/store/hooks";
import { hideToast, showToast, type AlertTone } from "@/app/store/uiSlice";

type ToastTone = "success" | "error" | "info";

export function useToast() {
  const dispatch = useAppDispatch();

  return {
    show(message: string, tone?: ToastTone) {
      dispatch(showToast({ message, tone }));
    },
    success(message: string) {
      dispatch(showToast({ message, tone: "success" }));
    },
    error(message: string) {
      dispatch(showToast({ message, tone: "error" }));
    },
    info(message: string) {
      dispatch(showToast({ message, tone: "info" }));
    },
    hide() {
      dispatch(hideToast());
    },
  };
}
