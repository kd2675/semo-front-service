"use client";

import { registerAlertCallbacks, takeAlertCallbacks } from "@/app/store/appAlertRegistry";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { hideAppAlert, showAppAlert, type AlertTone } from "@/app/store/uiSlice";

export function useAppAlert() {
  const dispatch = useAppDispatch();
  const alertState = useAppSelector((state) => state.ui.appAlert);

  const showAlert = ({
    title,
    message,
    tone = "default",
    confirmLabel = "확인",
    onClose,
  }: {
    title: string;
    message: string;
    tone?: AlertTone;
    confirmLabel?: string;
    onClose?: () => void | Promise<void>;
  }) => {
    const requestId = registerAlertCallbacks({ onClose });
    dispatch(showAppAlert({
      mode: "alert",
      title,
      message,
      tone,
      confirmLabel,
      requestId,
    }));
  };

  const showConfirm = ({
    title,
    message,
    tone = "default",
    confirmLabel = "확인",
    cancelLabel = "취소",
    onConfirm,
    onCancel,
    onClose,
  }: {
    title: string;
    message: string;
    tone?: AlertTone;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
    onClose?: () => void | Promise<void>;
  }) => {
    const requestId = registerAlertCallbacks({ onCancel, onClose, onConfirm });
    dispatch(showAppAlert({
      mode: "confirm",
      title,
      message,
      tone,
      confirmLabel,
      cancelLabel,
      requestId,
    }));
  };

  const closeAlert = async () => {
    const callbacks = takeAlertCallbacks(alertState.requestId);
    dispatch(hideAppAlert());
    try {
      if (callbacks?.onCancel) {
        await callbacks.onCancel();
        return;
      }
      await callbacks?.onClose?.();
    } catch (error) {
      console.error("App alert close callback failed.", error);
    }
  };

  const confirmAlert = async () => {
    const callbacks = takeAlertCallbacks(alertState.requestId);
    dispatch(hideAppAlert());
    try {
      await callbacks?.onConfirm?.();
      await callbacks?.onClose?.();
    } catch (error) {
      console.error("App alert confirm callback failed.", error);
    }
  };

  return {
    alertState,
    confirmAlert,
    showConfirm,
    showAlert,
    closeAlert,
  };
}
