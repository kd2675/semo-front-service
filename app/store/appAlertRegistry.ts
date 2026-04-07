type AlertCallback = (() => void | Promise<void>) | undefined;

type AlertCallbacks = {
  onConfirm?: AlertCallback;
  onCancel?: AlertCallback;
  onClose?: AlertCallback;
};

const registry = new Map<string, AlertCallbacks>();

export function registerAlertCallbacks(callbacks: AlertCallbacks): string | null {
  if (!callbacks.onConfirm && !callbacks.onCancel && !callbacks.onClose) {
    return null;
  }

  const requestId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  registry.set(requestId, callbacks);
  return requestId;
}

export function takeAlertCallbacks(requestId: string | null | undefined): AlertCallbacks | undefined {
  if (!requestId) {
    return undefined;
  }

  const callbacks = registry.get(requestId);
  registry.delete(requestId);
  return callbacks;
}
