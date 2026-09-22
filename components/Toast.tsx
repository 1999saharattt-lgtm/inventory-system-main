"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

export type ToastType =
  | "success"
  | "error"
  | "warning"
  | "info";

type ToastItem = {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  duration: number;
};

type ShowToastOptions = {
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (
    options: ShowToastOptions
  ) => void;

  success: (
    title: string,
    description?: string
  ) => void;

  error: (
    title: string,
    description?: string
  ) => void;

  warning: (
    title: string,
    description?: string
  ) => void;

  info: (
    title: string,
    description?: string
  ) => void;
};

/* =========================================================
   CONTEXT
========================================================= */

const ToastContext =
  createContext<ToastContextValue | null>(
    null
  );

/* =========================================================
   CONFIG
========================================================= */

const toastConfig = {
  success: {
    icon: CheckCircle2,

    iconClass:
      "border-emerald-200 bg-emerald-50 !text-emerald-600",

    accentClass:
      "bg-emerald-500",

    progressClass:
      "bg-emerald-500",
  },

  error: {
    icon: AlertCircle,

    iconClass:
      "border-red-200 bg-red-50 !text-red-600",

    accentClass:
      "bg-red-500",

    progressClass:
      "bg-red-500",
  },

  warning: {
    icon: AlertTriangle,

    iconClass:
      "border-amber-200 bg-amber-50 !text-amber-600",

    accentClass:
      "bg-amber-500",

    progressClass:
      "bg-amber-500",
  },

  info: {
    icon: Info,

    iconClass:
      "border-blue-200 bg-blue-50 !text-blue-600",

    accentClass:
      "bg-blue-500",

    progressClass:
      "bg-blue-500",
  },
} satisfies Record<
  ToastType,
  {
    icon: typeof CheckCircle2;
    iconClass: string;
    accentClass: string;
    progressClass: string;
  }
>;

/* =========================================================
   PROVIDER
========================================================= */

export function ToastProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [toasts, setToasts] = useState<
    ToastItem[]
  >([]);

  const idRef = useRef(0);

  /* =======================================================
     REMOVE
  ======================================================= */

  const removeToast = useCallback(
    (id: number) => {
      setToasts((current) =>
        current.filter(
          (toast) => toast.id !== id
        )
      );
    },
    []
  );

  /* =======================================================
     SHOW
  ======================================================= */

  const showToast = useCallback(
    ({
      type = "info",
      title,
      description,
      duration = 3500,
    }: ShowToastOptions) => {
      idRef.current += 1;

      const id = idRef.current;

      setToasts((current) => [
        ...current,
        {
          id,
          type,
          title,
          description,
          duration,
        },
      ]);
    },
    []
  );

  /* =======================================================
     SHORTCUT METHODS
  ======================================================= */

  const success = useCallback(
    (
      title: string,
      description?: string
    ) => {
      showToast({
        type: "success",
        title,
        description,
      });
    },
    [showToast]
  );

  const error = useCallback(
    (
      title: string,
      description?: string
    ) => {
      showToast({
        type: "error",
        title,
        description,
      });
    },
    [showToast]
  );

  const warning = useCallback(
    (
      title: string,
      description?: string
    ) => {
      showToast({
        type: "warning",
        title,
        description,
      });
    },
    [showToast]
  );

  const info = useCallback(
    (
      title: string,
      description?: string
    ) => {
      showToast({
        type: "info",
        title,
        description,
      });
    },
    [showToast]
  );

  const contextValue =
    useMemo<ToastContextValue>(
      () => ({
        showToast,
        success,
        error,
        warning,
        info,
      }),
      [
        showToast,
        success,
        error,
        warning,
        info,
      ]
    );

  return (
    <ToastContext.Provider
      value={contextValue}
    >
      {children}

      {/* ===================================================
          TOAST CONTAINER
      =================================================== */}

      <div
        className="
          pointer-events-none

          fixed
          left-1/2
          top-4
          z-[10000]

          flex
          w-[calc(100%-24px)]
          max-w-[430px]
          -translate-x-1/2
          flex-col
          gap-2.5

          sm:top-5
          sm:w-[430px]
        "
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onClose={() =>
              removeToast(toast.id)
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* =========================================================
   TOAST CARD
========================================================= */

function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: () => void;
}) {
  const config =
    toastConfig[toast.type];

  const Icon = config.icon;

  /* =======================================================
     AUTO CLOSE
  ======================================================= */

  useEffect(() => {
    if (toast.duration <= 0) {
      return;
    }

    const timer = window.setTimeout(
      onClose,
      toast.duration
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    toast.duration,
    onClose,
  ]);

  return (
    <div
      role={
        toast.type === "error"
          ? "alert"
          : "status"
      }
      className="
        pointer-events-auto

        relative
        isolate

        w-full

        overflow-hidden

        rounded-[22px]

        border
        border-white/90

        bg-white/88

        shadow-[0_18px_55px_rgba(15,23,42,0.18),0_4px_15px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,1)]

        backdrop-blur-3xl
        backdrop-saturate-150

        animate-[iosToastIn_0.35s_cubic-bezier(0.16,1,0.3,1)]
      "
    >
      {/* ===================================================
          TOP LIGHT
      =================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          inset-x-8
          top-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white
          to-transparent
        "
      />

      {/* ===================================================
          LEFT ACCENT
      =================================================== */}

      <span
        aria-hidden="true"
        className={`
          absolute
          bottom-4
          left-0
          top-4

          w-1

          rounded-r-full

          ${config.accentClass}
        `}
      />

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div
        className="
          flex
          min-w-0
          items-start
          gap-3

          px-4
          pb-4
          pt-4

          sm:px-5
        "
      >
        {/* ICON */}

        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center

            rounded-[14px]

            border

            shadow-[0_4px_12px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]

            ${config.iconClass}
          `}
        >
          <Icon
            size={22}
            strokeWidth={2.4}
          />
        </div>

        {/* TEXT */}

        <div
          className="
            min-w-0
            flex-1
            pt-0.5
          "
        >
          <p
            className="
              break-words

              text-base
              font-extrabold
              leading-tight

              !text-slate-950

              sm:text-lg
            "
          >
            {toast.title}
          </p>

          {toast.description && (
            <p
              className="
                mt-1

                break-words

                text-sm
                font-semibold
                leading-relaxed

                !text-slate-500

                sm:text-base
              "
            >
              {toast.description}
            </p>
          )}
        </div>

        {/* CLOSE */}

        <button
          type="button"
          aria-label="ปิดการแจ้งเตือน"
          onClick={onClose}
          className="
            flex
            h-8
            w-8
            shrink-0
            items-center
            justify-center

            rounded-full

            bg-slate-100/90

            p-0

            !text-slate-400

            shadow-none

            transition-all
            duration-200

            hover:scale-105
            hover:bg-slate-200
            hover:!text-slate-700

            active:scale-90
          "
        >
          <X
            size={16}
            strokeWidth={2.5}
          />
        </button>
      </div>

      {/* ===================================================
          PROGRESS
      =================================================== */}

      {toast.duration > 0 && (
        <div
          aria-hidden="true"
          className="
            absolute
            bottom-0
            left-0
            right-0

            h-[3px]

            overflow-hidden

            bg-slate-100/70
          "
        >
          <div
            className={`
              h-full
              w-full

              origin-left

              ${config.progressClass}
            `}
            style={{
              animation: `iosToastProgress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      {/* ===================================================
          ANIMATION
      =================================================== */}

      <style jsx global>{`
        @keyframes iosToastIn {
          0% {
            opacity: 0;
            transform: translateY(-18px)
              scale(0.96);
          }

          100% {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        @keyframes iosToastProgress {
          from {
            transform: scaleX(1);
          }

          to {
            transform: scaleX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [role="status"],
          [role="alert"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useToast() {
  const context =
    useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast ต้องใช้งานภายใน ToastProvider"
    );
  }

  return context;
}