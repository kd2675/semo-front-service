"use client";

import { useCallback } from "react";
import {
  clearModalCallbacks,
  registerModalCallbacks,
} from "@/app/redux/modal-callback-registry";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  addNoti,
  deleteAllNoti,
  deleteNoti,
  type NotiTone,
} from "@/app/redux/slices/modal-slice";

export function useAppNoti() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.modal.noti);

  const showNoti = useCallback((payload: {
    title: string;
    message: string;
    tone?: NotiTone;
    actionLabel?: string;
    onAction?: () => void | Promise<void>;
  }) => {
    const action = addNoti(payload);
    dispatch(action);
    registerModalCallbacks(action.payload.id, {
      onAction: payload.onAction,
    });
    return action.payload.id;
  }, [dispatch]);

  const closeNoti = useCallback((id: string) => {
    clearModalCallbacks(id);
    dispatch(deleteNoti(id));
  }, [dispatch]);

  const clearNoti = useCallback(() => {
    notifications.forEach((item) => clearModalCallbacks(item.id));
    dispatch(deleteAllNoti());
  }, [dispatch, notifications]);

  return {
    notifications,
    showNoti,
    closeNoti,
    clearNoti,
  };
}
