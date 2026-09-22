"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type ConfirmDialogVariant =
  | "danger"
  | "warning"
  | "success"
  | "info";

type ConfirmDialogProps = {
  open: boolean;

  title: string;

  description?: string;

  children?: ReactNode;

  confirmText?: string;

  cancelText?: string;

  variant?: ConfirmDialogVariant;

  loading?: boolean;

  disableConfirm?: boolean;

  onConfirm: () => void | Promise<void>;

  onCancel: () => void;
};

/* =========================================================
   VARIANT CONFIG
========================================================= */

const variantConfig = {
  danger: {
    icon: Trash2,

    iconContainer:
      "border-red-200 bg-red-50 text-red-600",

    confirmButton:
      "border-red-500/30 bg-gradient-to-b from-red-500 to-red-600 hover:from-red-500 hover:to-red-700",

    glow:
      "bg-red-500/10",
  },

  warning: {
    icon: AlertTriangle,

    iconContainer:
      "border-amber-200 bg-amber-50 text-amber-600",

    confirmButton:
      "border-amber-500/30 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-600",

    glow:
      "bg-amber-500/10",
  },

  success: {
    icon: CheckCircle2,

    iconContainer:
      "border-emerald-200 bg-emerald-50 text-emerald-600",

    confirmButton:
      "border-emerald-500/30 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700",

    glow:
      "bg-emerald-500/10",
  },

  info: {
    icon: Info,

    iconContainer:
      "border-blue-200 bg-blue-50 text-blue-600",

    confirmButton:
      "border-blue-500/30 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-500 hover:to-blue-700",

    glow:
      "bg-blue-500/10",
  },
} satisfies Record<
  ConfirmDialogVariant,
  {
    icon: typeof Trash2;
    iconContainer: string;
    confirmButton: string;
    glow: string;
  }
>;

/* =========================================================
   COMPONENT
========================================================= */

export default function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "info",
  loading = false,
  disableConfirm = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef =
    useRef<HTMLDivElement>(null);

  const config =
    variantConfig[variant];

  const Icon = config.icon;

  /* =======================================================
     ESC TO CLOSE
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        if (!loading) {
          onCancel();
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, loading, onCancel]);

  /* =======================================================
     LOCK BODY SCROLL
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  /* =======================================================
     AUTO FOCUS
  ======================================================= */

  useEffect(() => {
    if (!open) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        dialogRef.current?.focus();
      },
      50
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

  /* =======================================================
     CLOSED
  ======================================================= */

  if (!open) {
    return null;
  }

  /* =======================================================
     CONFIRM
  ======================================================= */

  async function handleConfirm() {
    if (
      loading ||
      disableConfirm
    ) {
      return;
    }

    await onConfirm();
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]

        flex
        items-end
        justify-center

        p-3

        sm:items-center
        sm:p-6
      "
      role="presentation"
    >
      {/* ===================================================
          BACKDROP
      =================================================== */}

      <button
        type="button"
        aria-label="ปิดหน้าต่าง"
        disabled={loading}
        onClick={() => {
          if (!loading) {
            onCancel();
          }
        }}
        className="
          absolute
          inset-0

          h-full
          w-full

          cursor-default

          rounded-none

          bg-slate-950/40

          p-0

          backdrop-blur-[8px]

          transition-opacity
          duration-300

          hover:translate-y-0

          disabled:cursor-wait
        "
      />

      {/* ===================================================
          DIALOG
      =================================================== */}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={
          description
            ? "confirm-dialog-description"
            : undefined
        }
        tabIndex={-1}
        className="
          relative
          z-10

          w-full
          max-w-[460px]

          overflow-hidden

          rounded-[28px]

          border
          border-white/80

          bg-white/90

          shadow-[0_30px_80px_rgba(15,23,42,0.28),0_8px_30px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,1)]

          backdrop-blur-3xl
          backdrop-saturate-150

          outline-none

          animate-[iosDialogIn_0.28s_cubic-bezier(0.16,1,0.3,1)]

          sm:rounded-[30px]
        "
      >
        {/* =================================================
            TOP HIGHLIGHT
        ================================================= */}

        <span
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            inset-x-10
            top-0

            h-px

            bg-gradient-to-r
            from-transparent
            via-white
            to-transparent
          "
        />

        {/* =================================================
            BACKGROUND GLOW
        ================================================= */}

        <div
          aria-hidden="true"
          className={`
            pointer-events-none

            absolute
            -right-20
            -top-20

            h-52
            w-52

            rounded-full

            blur-3xl

            ${config.glow}
          `}
        />

        {/* =================================================
            CLOSE BUTTON
        ================================================= */}

        <button
          type="button"
          aria-label="ปิด"
          disabled={loading}
          onClick={onCancel}
          className="
            absolute
            right-4
            top-4
            z-20

            flex
            h-9
            w-9
            items-center
            justify-center

            rounded-full

            border
            border-slate-200/80

            bg-slate-100/90

            p-0

            !text-slate-500

            shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]

            transition-all
            duration-200

            hover:scale-105
            hover:bg-slate-200
            hover:!text-slate-800

            active:scale-90

            disabled:cursor-not-allowed
            disabled:opacity-50

            sm:right-5
            sm:top-5
          "
        >
          <X
            size={18}
            strokeWidth={2.5}
          />
        </button>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div
          className="
            relative
            z-10

            px-5
            pb-5
            pt-7

            sm:px-7
            sm:pb-7
            sm:pt-8
          "
        >
          {/* ===============================================
              ICON
          =============================================== */}

          <div
            className="
              flex
              justify-center
            "
          >
            <div
              className={`
                flex
                h-16
                w-16
                items-center
                justify-center

                rounded-[20px]

                border

                shadow-[0_8px_24px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]

                ${config.iconContainer}
              `}
            >
              <Icon
                size={30}
                strokeWidth={2.3}
              />
            </div>
          </div>

          {/* ===============================================
              TITLE
          =============================================== */}

          <h2
            id="confirm-dialog-title"
            className="
              mt-5

              text-center

              text-xl
              font-extrabold
              leading-tight

              !text-slate-950

              sm:text-2xl
            "
          >
            {title}
          </h2>

          {/* ===============================================
              DESCRIPTION
          =============================================== */}

          {description && (
            <p
              id="confirm-dialog-description"
              className="
                mx-auto
                mt-2

                max-w-[360px]

                text-center

                text-sm
                font-semibold
                leading-relaxed

                !text-slate-500

                sm:text-base
              "
            >
              {description}
            </p>
          )}

          {/* ===============================================
              CUSTOM CONTENT
          =============================================== */}

          {children && (
            <div
              className="
                mt-5

                rounded-[18px]

                border
                border-slate-200/80

                bg-slate-50/80

                p-4

                shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]
              "
            >
              {children}
            </div>
          )}

          {/* ===============================================
              BUTTONS
          =============================================== */}

          <div
            className="
              mt-6

              grid
              grid-cols-2
              gap-3
            "
          >
            {/* CANCEL */}

            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="
                flex
                min-h-[48px]
                w-full
                items-center
                justify-center

                rounded-[15px]

                border
                border-slate-200

                bg-white/90

                px-5
                py-3

                text-base
                font-extrabold

                !text-slate-700

                shadow-[0_4px_12px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]

                transition-all
                duration-200
                ease-out

                hover:-translate-y-0.5
                hover:border-slate-300
                hover:bg-slate-50

                active:translate-y-0
                active:scale-[0.96]

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {cancelText}
            </button>

            {/* CONFIRM */}

            <button
              type="button"
              disabled={
                loading ||
                disableConfirm
              }
              onClick={handleConfirm}
              className={`
                flex
                min-h-[48px]
                w-full
                items-center
                justify-center
                gap-2

                rounded-[15px]

                border

                px-5
                py-3

                text-base
                font-extrabold

                !text-white

                shadow-[0_7px_18px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.22)]

                transition-all
                duration-200
                ease-out

                hover:-translate-y-0.5

                active:translate-y-0
                active:scale-[0.96]

                disabled:cursor-not-allowed
                disabled:opacity-50
                disabled:hover:translate-y-0

                ${config.confirmButton}
              `}
            >
              {loading && (
                <span
                  className="
                    h-4
                    w-4

                    animate-spin

                    rounded-full

                    border-2
                    border-white/40
                    border-t-white
                  "
                />
              )}

              <span>
                {loading
                  ? "กำลังดำเนินการ..."
                  : confirmText}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================
          LOCAL ANIMATION
      =================================================== */}

      <style jsx global>{`
        @keyframes iosDialogIn {
          0% {
            opacity: 0;
            transform: translateY(18px)
              scale(0.96);
          }

          100% {
            opacity: 1;
            transform: translateY(0)
              scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [role="dialog"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}