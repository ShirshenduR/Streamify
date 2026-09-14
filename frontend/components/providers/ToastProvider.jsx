"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

let nextId = 0;

const ICONS = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
  default: Info,
};

const ACCENTS = {
  success: "text-emerald-400",
  error: "text-rose-400",
  info: "text-sky-400",
  default: "text-foreground-500",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message, { title, variant = "default", duration = 3800 } = {}) => {
      if (!message) return null;
      const id = ++nextId;
      // Cap the stack so a burst of failures cannot bury the screen.
      setToasts((current) => [...current.slice(-2), { id, message, title, variant }]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: show,
      dismiss,
      success: (message, options) => show(message, { ...options, variant: "success" }),
      error: (message, options) => show(message, { ...options, variant: "error" }),
      info: (message, options) => show(message, { ...options, variant: "info" }),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-20 z-[90] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant] ?? ICONS.default;
          return (
            <div
              key={toast.id}
              role="status"
              className="animate-toast-in glass pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl px-4 py-3"
            >
              <Icon className={`mt-0.5 size-4 shrink-0 ${ACCENTS[toast.variant]}`} />
              <div className="min-w-0 flex-1">
                {toast.title ? (
                  <p className="text-sm font-semibold tracking-tight">{toast.title}</p>
                ) : null}
                <p className="text-sm text-foreground-600">{toast.message}</p>
              </div>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss(toast.id)}
                className="-mr-1 rounded-full p-1 text-foreground-500 transition hover:bg-white/10 hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
