"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  addAlert,
  deleteAlert,
  deleteAllAlert,
  type AlertTone,
} from "@/app/redux/slices/modal-slice";

export function useAppAlert() {
  const dispatch = useAppDispatch();
  const currentAlert = useAppSelector((state) => state.modal.alert[0] ?? null);

  const showAlert = useCallback(({
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
    dispatch(addAlert({
      title,
      message,
      tone,
      confirmLabel,
    }));
  }, [dispatch]);

  const closeAlert = useCallback(() => {
    if (currentAlert) {
      dispatch(deleteAlert(currentAlert.id));
      return;
    }

    dispatch(deleteAllAlert());
  }, [currentAlert, dispatch]);

  return {
    showAlert,
    closeAlert,
  };
}
