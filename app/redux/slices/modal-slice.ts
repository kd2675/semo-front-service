import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AlertTone = "default" | "info" | "success" | "warning" | "danger";
export type ToastTone = "success" | "error" | "info" | "warning";
export type ConfirmTone = "default" | "success" | "warning" | "danger";
export type NotiTone = "default" | "info" | "success" | "warning" | "danger";

export type AlertItem = {
  id: string;
  title: string;
  message: string;
  tone: AlertTone;
  confirmLabel: string;
};

export type ToastItem = {
  id: string;
  title: string | null;
  message: string;
  tone: ToastTone;
  actionLabel: string | null;
  durationMs: number;
};

export type ConfirmItem = {
  id: string;
  title: string;
  message: string;
  tone: ConfirmTone;
  cancelLabel: string;
  confirmLabel: string;
  dismissOnBackdrop: boolean;
};

export type NotiItem = {
  id: string;
  title: string;
  message: string;
  tone: NotiTone;
  actionLabel: string | null;
};

export type ModalState = {
  alert: AlertItem[];
  toast: ToastItem[];
  confirm: ConfirmItem[];
  noti: NotiItem[];
};

type AlertPayload = {
  title?: string;
  message: string;
  tone?: AlertTone;
  confirmLabel?: string;
};

type ToastPayload = {
  title?: string | null;
  message: string;
  tone?: ToastTone;
  actionLabel?: string | null;
  durationMs?: number;
};

type ConfirmPayload = {
  title: string;
  message: string;
  tone?: ConfirmTone;
  cancelLabel?: string;
  confirmLabel?: string;
  dismissOnBackdrop?: boolean;
};

type NotiPayload = {
  title: string;
  message: string;
  tone?: NotiTone;
  actionLabel?: string | null;
};

const initialState: ModalState = {
  alert: [],
  toast: [],
  confirm: [],
  noti: [],
};

function createModalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `modal-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    addAlert: {
      reducer(state, action: PayloadAction<AlertItem>) {
        state.alert.unshift(action.payload);
      },
      prepare(payload: AlertPayload) {
        return {
          payload: {
            id: createModalId(),
            title: payload.title?.trim() || "안내",
            message: payload.message.trim(),
            tone: payload.tone ?? "default",
            confirmLabel: payload.confirmLabel?.trim() || "확인",
          } satisfies AlertItem,
        };
      },
    },
    deleteAlert(state, action: PayloadAction<string>) {
      state.alert = state.alert.filter((item) => item.id !== action.payload);
    },
    deleteAllAlert(state) {
      state.alert = [];
    },
    addToast: {
      reducer(state, action: PayloadAction<ToastItem>) {
        state.toast.unshift(action.payload);
      },
      prepare(payload: ToastPayload) {
        return {
          payload: {
            id: createModalId(),
            title: payload.title?.trim() || null,
            message: payload.message.trim(),
            tone: payload.tone ?? "success",
            actionLabel: payload.actionLabel?.trim() || null,
            durationMs: payload.durationMs ?? 2000,
          } satisfies ToastItem,
        };
      },
    },
    deleteToast(state, action: PayloadAction<string>) {
      state.toast = state.toast.filter((item) => item.id !== action.payload);
    },
    addConfirm: {
      reducer(state, action: PayloadAction<ConfirmItem>) {
        state.confirm.unshift(action.payload);
      },
      prepare(payload: ConfirmPayload) {
        return {
          payload: {
            id: createModalId(),
            title: payload.title.trim(),
            message: payload.message.trim(),
            tone: payload.tone ?? "default",
            cancelLabel: payload.cancelLabel?.trim() || "취소",
            confirmLabel: payload.confirmLabel?.trim() || "확인",
            dismissOnBackdrop: payload.dismissOnBackdrop ?? false,
          } satisfies ConfirmItem,
        };
      },
    },
    deleteConfirm(state, action: PayloadAction<string>) {
      state.confirm = state.confirm.filter((item) => item.id !== action.payload);
    },
    addNoti: {
      reducer(state, action: PayloadAction<NotiItem>) {
        state.noti.unshift(action.payload);
      },
      prepare(payload: NotiPayload) {
        return {
          payload: {
            id: createModalId(),
            title: payload.title.trim(),
            message: payload.message.trim(),
            tone: payload.tone ?? "default",
            actionLabel: payload.actionLabel?.trim() || null,
          } satisfies NotiItem,
        };
      },
    },
    deleteNoti(state, action: PayloadAction<string>) {
      state.noti = state.noti.filter((item) => item.id !== action.payload);
    },
    deleteAllNoti(state) {
      state.noti = [];
    },
  },
});

export const {
  addAlert,
  addConfirm,
  addNoti,
  addToast,
  deleteAlert,
  deleteAllAlert,
  deleteAllNoti,
  deleteConfirm,
  deleteNoti,
  deleteToast,
} = modalSlice.actions;

export default modalSlice.reducer;
