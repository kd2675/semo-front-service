type ModalCallback = (() => void | Promise<void>) | undefined;

type ModalHandlers = {
  onCancel?: ModalCallback;
  onConfirm?: ModalCallback;
  onAction?: ModalCallback;
};

const callbackRegistry = new Map<string, ModalHandlers>();

export function registerModalCallbacks(id: string, handlers: ModalHandlers): void {
  if (!handlers.onCancel && !handlers.onConfirm && !handlers.onAction) {
    callbackRegistry.delete(id);
    return;
  }

  callbackRegistry.set(id, handlers);
}

export async function invokeModalCallback(
  id: string,
  type: keyof ModalHandlers,
): Promise<void> {
  const callback = callbackRegistry.get(id)?.[type];
  if (!callback) {
    return;
  }

  await callback();
}

export function clearModalCallbacks(id: string): void {
  callbackRegistry.delete(id);
}
