import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ToastTone = "success" | "error" | "info";
export type AlertTone = "default" | "warning" | "danger";
export type AlertMode = "alert" | "confirm";

type ToastPayload = {
  message: string;
  tone?: ToastTone;
};

type AlertPayload = {
  mode?: AlertMode;
  title: string;
  message: string;
  tone?: AlertTone;
  confirmLabel?: string;
  cancelLabel?: string;
  requestId?: string | null;
};

export type AppAlertState = {
  open: boolean;
  mode: AlertMode;
  title: string;
  message: string;
  tone: AlertTone;
  confirmLabel: string;
  cancelLabel: string;
  requestId: string | null;
};

type UiState = {
  toastOpen: boolean;
  toastMessage: string;
  toastTone: ToastTone;
  toastId: number;
  appAlert: AppAlertState;
};

const initialAlertState: AppAlertState = {
  open: false,
  mode: "alert",
  title: "",
  message: "",
  tone: "default",
  confirmLabel: "확인",
  cancelLabel: "취소",
  requestId: null,
};

const initialState: UiState = {
  toastOpen: false,
  toastMessage: "",
  toastTone: "success",
  toastId: 0,
  appAlert: initialAlertState,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showToast(state, action: PayloadAction<ToastPayload | string>) {
      const payload =
        typeof action.payload === "string"
          ? { message: action.payload }
          : action.payload;

      const message = payload.message.trim();
      if (!message) return;

      state.toastOpen = true;
      state.toastMessage = message;
      state.toastTone = payload.tone ?? "success";
      state.toastId += 1;
    },
    hideToast(state) {
      state.toastOpen = false;
      state.toastMessage = "";
    },
    showAppAlert(state, action: PayloadAction<AlertPayload>) {
      state.appAlert = {
        open: true,
        mode: action.payload.mode ?? "alert",
        title: action.payload.title.trim(),
        message: action.payload.message.trim(),
        tone: action.payload.tone ?? "default",
        confirmLabel: action.payload.confirmLabel?.trim() || "확인",
        cancelLabel: action.payload.cancelLabel?.trim() || "취소",
        requestId: action.payload.requestId ?? null,
      };
    },
    hideAppAlert(state) {
      state.appAlert = initialAlertState;
    },
  },
});

export const { hideAppAlert, hideToast, showAppAlert, showToast } = uiSlice.actions;
export default uiSlice.reducer;
