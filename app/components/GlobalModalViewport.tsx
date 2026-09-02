"use client";

import { AnimatePresence } from "motion/react";
import { useEffect } from "react";
import { BasicAlert } from "@/app/components/modal/BasicAlert";
import { BasicConfirm } from "@/app/components/modal/BasicConfirm";
import { BasicNoti } from "@/app/components/modal/BasicNoti";
import { BasicToast } from "@/app/components/modal/BasicToast";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  deleteAllAlert,
  deleteAllNoti,
  deleteConfirm,
  deleteNoti,
  deleteToast,
  type ConfirmItem,
  type NotiItem,
} from "@/app/redux/slices/modalSlice";
import {
  clearModalCallbacks,
  invokeModalCallback,
} from "@/app/redux/modalCallbackRegistry";

function GlobalAlertLayer() {
  const dispatch = useAppDispatch();
  const alert = useAppSelector((state) => state.modal.alert[0] ?? null);

  useEffect(() => {
    if (!alert) {
      return;
    }

    if (alert.tone === "danger" || alert.tone === "warning") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(deleteAllAlert());
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [alert, dispatch]);

  return (
    <AnimatePresence initial={false}>
      {alert ? (
        <BasicAlert alert={alert} onClose={() => dispatch(deleteAllAlert())} />
      ) : null}
    </AnimatePresence>
  );
}

function GlobalToastLayer() {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((state) => state.modal.toast[0] ?? null);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(deleteToast(toast.id));
      clearModalCallbacks(toast.id);
    }, toast.durationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dispatch, toast]);

  const handleClose = () => {
    if (!toast) {
      return;
    }
    dispatch(deleteToast(toast.id));
    clearModalCallbacks(toast.id);
  };

  const handleAction = async () => {
    if (!toast) {
      return;
    }
    await invokeModalCallback(toast.id, "onAction");
    handleClose();
  };

  return (
    <AnimatePresence initial={false} mode="wait">
      {toast ? (
        <BasicToast
          key={toast.id}
          toast={toast}
          onAction={() => void handleAction()}
          onClose={handleClose}
        />
      ) : null}
    </AnimatePresence>
  );
}

function GlobalConfirmLayer() {
  const dispatch = useAppDispatch();
  const confirm = useAppSelector((state) => state.modal.confirm[0] ?? null);
  const handleClose = (id: string) => {
    dispatch(deleteConfirm(id));
    clearModalCallbacks(id);
  };

  const handleCancel = async (item: ConfirmItem) => {
    await invokeModalCallback(item.id, "onCancel");
    handleClose(item.id);
  };

  const handleConfirm = async (item: ConfirmItem) => {
    await invokeModalCallback(item.id, "onConfirm");
    handleClose(item.id);
  };

  return (
    <AnimatePresence initial={false} mode="wait">
      {confirm ? (
        <BasicConfirm
          key={confirm.id}
          confirm={confirm}
          onCancel={() => void handleCancel(confirm)}
          onConfirm={() => void handleConfirm(confirm)}
        />
      ) : null}
    </AnimatePresence>
  );
}

function GlobalNotiLayer() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.modal.noti);

  const handleClose = (id: string) => {
    dispatch(deleteNoti(id));
    clearModalCallbacks(id);
  };

  const handleAction = async (item: NotiItem) => {
    await invokeModalCallback(item.id, "onAction");
    handleClose(item.id);
  };

  const handleClearAll = () => {
    notifications.forEach((item) => clearModalCallbacks(item.id));
    dispatch(deleteAllNoti());
  };

  return (
    <AnimatePresence initial={false}>
      {notifications.length > 0 ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[95] flex w-[min(92vw,24rem)] flex-col gap-3">
          {notifications.length > 1 ? (
            <div className="pointer-events-auto flex justify-end">
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              >
                모두 지우기
              </button>
            </div>
          ) : null}
          {notifications.map((item) => (
            <BasicNoti
              key={item.id}
              notification={item}
              onAction={() => void handleAction(item)}
              onClose={() => handleClose(item.id)}
            />
          ))}
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function GlobalModalViewport() {
  return (
    <>
      <GlobalAlertLayer />
      <GlobalToastLayer />
      <GlobalConfirmLayer />
      <GlobalNotiLayer />
    </>
  );
}
