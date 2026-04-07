"use client";

import { useCallback } from "react";
import {
  clearModalCallbacks,
  registerModalCallbacks,
} from "@/app/redux/modal-callback-registry";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  addConfirm,
  deleteConfirm,
  type ConfirmTone,
} from "@/app/redux/slices/modal-slice";

export function useAppConfirm() {
  const dispatch = useAppDispatch();
  const currentConfirm = useAppSelector((state) => state.modal.confirm[0] ?? null);

  const showConfirm = useCallback((payload: {
    title: string;
    message: string;
    tone?: ConfirmTone;
    cancelLabel?: string;
    confirmLabel?: string;
    dismissOnBackdrop?: boolean;
    onCancel?: () => void | Promise<void>;
    onConfirm?: () => void | Promise<void>;
  }) => {
    const action = addConfirm(payload);
    dispatch(action);
    registerModalCallbacks(action.payload.id, {
      onCancel: payload.onCancel,
      onConfirm: payload.onConfirm,
    });
    return action.payload.id;
  }, [dispatch]);

  const closeConfirm = useCallback((id?: string) => {
    const targetId = id ?? currentConfirm?.id;
    if (!targetId) {
      return;
    }

    clearModalCallbacks(targetId);
    dispatch(deleteConfirm(targetId));
  }, [currentConfirm?.id, dispatch]);

  return {
    confirm: currentConfirm,
    showConfirm,
    closeConfirm,
  };
}
