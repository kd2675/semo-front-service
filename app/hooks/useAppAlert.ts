"use client";

import { useState } from "react";

type AlertTone = "default" | "warning" | "danger";

export type AppAlertState = {
  open: boolean;
  title: string;
  message: string;
  tone: AlertTone;
  confirmLabel: string;
};

const INITIAL_ALERT_STATE: AppAlertState = {
  open: false,
  title: "",
  message: "",
  tone: "default",
  confirmLabel: "확인",
};

export function useAppAlert() {
  const [alertState, setAlertState] = useState<AppAlertState>(INITIAL_ALERT_STATE);

  const showAlert = ({
    title,
    message,
    tone = "default",
    confirmLabel = "확인",
  }: {
    title: string;
    message: string;
    tone?: AlertTone;
    confirmLabel?: string;
  }) => {
    setAlertState({
      open: true,
      title,
      message,
      tone,
      confirmLabel,
    });
  };

  const closeAlert = () => {
    setAlertState(INITIAL_ALERT_STATE);
  };

  return {
    alertState,
    showAlert,
    closeAlert,
  };
}
