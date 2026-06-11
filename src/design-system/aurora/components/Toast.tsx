import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastTone = "success" | "warning" | "error" | "info";

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
  tone: ToastTone;
  createdAt: number;
  ttlMs: number;
};

type ToastContextValue = {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id" | "createdAt">) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function uuid(): string {
  return `${Date.now().toString(16)}_${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => setToasts([]), []);

  const push = useCallback(
    (toast: Omit<ToastItem, "id" | "createdAt">) => {
      const id = uuid();
      const item: ToastItem = {
        ...toast,
        id,
        createdAt: Date.now(),
      };
      setToasts((prev) => [item, ...prev].slice(0, 5));

      window.setTimeout(() => {
        dismiss(id);
      }, toast.ttlMs);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, push, dismiss, clear }),
    [toasts, push, dismiss, clear],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="aurora-toast-viewport" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <div key={t.id} className={`aurora-toast aurora-toast--${t.tone}`}>
          <div className="aurora-toast__body">
            <div className="aurora-toast__title">{t.title}</div>
            {t.message ? <div className="aurora-toast__message">{t.message}</div> : null}
          </div>
          <button
            type="button"
            className="aurora-toast__dismiss"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

