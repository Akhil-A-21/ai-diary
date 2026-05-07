import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastQueue: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

function notify() {
  listeners.forEach((l) => l([...toastQueue]));
}

export function toast(t: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  toastQueue.push({ ...t, id });
  notify();
  setTimeout(() => {
    toastQueue = toastQueue.filter((x) => x.id !== id);
    notify();
  }, 4000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useState(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  });

  const dismiss = useCallback((id: string) => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    notify();
  }, []);

  return { toasts, toast, dismiss };
}
