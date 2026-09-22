"use client";

import { LoaderCircle } from "lucide-react";

type LoadingScreenProps = {
  title?: string;
  description?: string;
  fullScreen?: boolean;
};

export default function LoadingScreen({
  title = "กำลังโหลดข้อมูล",
  description = "กรุณารอสักครู่...",
  fullScreen = false,
}: LoadingScreenProps) {
  return (
    <div
      className={`
        relative
        isolate
        flex
        w-full
        items-center
        justify-center
        overflow-hidden

        ${
          fullScreen
            ? "min-h-screen"
            : "min-h-[420px]"
        }
      `}
      role="status"
      aria-live="polite"
      aria-label={title}
    >
      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0

          bg-gradient-to-br
          from-slate-50
          via-white
          to-blue-50/70
        "
      />

      {/* =====================================================
          BACKGROUND GLOW
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-24
          -top-24

          h-72
          w-72

          rounded-full
          bg-blue-400/10

          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-28
          -right-24

          h-80
          w-80

          rounded-full
          bg-cyan-400/10

          blur-3xl
        "
      />

      {/* =====================================================
          LOADING CARD
      ===================================================== */}

      <div
        className="
          relative
          z-10

          mx-4
          flex
          w-full
          max-w-[360px]
          flex-col
          items-center

          overflow-hidden

          rounded-[30px]

          border
          border-white/90

          bg-white/75

          px-6
          py-8

          text-center

          shadow-[0_24px_70px_rgba(15,23,42,0.10),0_6px_20px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,1)]

          backdrop-blur-3xl
          backdrop-saturate-150

          sm:px-8
          sm:py-10
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
            inset-x-10
            top-0

            h-px

            bg-gradient-to-r
            from-transparent
            via-white
            to-transparent
          "
        />

        {/* ===================================================
            ICON AREA
        =================================================== */}

        <div
          className="
            relative
            flex
            h-20
            w-20
            items-center
            justify-center

            rounded-[24px]

            border
            border-blue-100

            bg-gradient-to-b
            from-white
            to-blue-50

            shadow-[0_10px_30px_rgba(37,99,235,0.12),inset_0_1px_0_rgba(255,255,255,1)]
          "
        >
          {/* Pulse */}

          <span
            aria-hidden="true"
            className="
              absolute
              inset-2

              animate-ping

              rounded-[18px]

              bg-blue-500/10
            "
          />

          {/* Spinner */}

          <LoaderCircle
            size={38}
            strokeWidth={2.3}
            className="
              relative
              z-10

              animate-spin

              !text-blue-600
            "
          />
        </div>

        {/* ===================================================
            TITLE
        =================================================== */}

        <h2
          className="
            mt-6

            text-xl
            font-extrabold
            leading-tight

            !text-slate-950

            sm:text-2xl
          "
        >
          {title}
        </h2>

        {/* ===================================================
            DESCRIPTION
        =================================================== */}

        <p
          className="
            mt-2

            text-sm
            font-semibold
            leading-relaxed

            !text-slate-500

            sm:text-base
          "
        >
          {description}
        </p>

        {/* ===================================================
            IOS PROGRESS DOTS
        =================================================== */}

        <div
          aria-hidden="true"
          className="
            mt-6
            flex
            items-center
            justify-center
            gap-2
          "
        >
          <span
            className="
              h-2
              w-2

              animate-[iosLoadingDot_1.2s_ease-in-out_infinite]

              rounded-full
              bg-blue-500
            "
          />

          <span
            className="
              h-2
              w-2

              animate-[iosLoadingDot_1.2s_ease-in-out_0.15s_infinite]

              rounded-full
              bg-blue-500
            "
          />

          <span
            className="
              h-2
              w-2

              animate-[iosLoadingDot_1.2s_ease-in-out_0.3s_infinite]

              rounded-full
              bg-blue-500
            "
          />
        </div>

        {/* ===================================================
            PROGRESS SHIMMER
        =================================================== */}

        <div
          aria-hidden="true"
          className="
            mt-6
            h-1.5
            w-full
            max-w-[210px]

            overflow-hidden

            rounded-full

            bg-slate-100
          "
        >
          <div
            className="
              h-full
              w-[45%]

              rounded-full

              bg-gradient-to-r
              from-blue-500
              via-cyan-400
              to-blue-500

              animate-[iosLoadingBar_1.4s_ease-in-out_infinite]
            "
          />
        </div>
      </div>

      {/* =====================================================
          ANIMATION
      ===================================================== */}

      <style jsx global>{`
        @keyframes iosLoadingDot {
          0%,
          60%,
          100% {
            opacity: 0.3;
            transform: translateY(0) scale(0.85);
          }

          30% {
            opacity: 1;
            transform: translateY(-4px) scale(1);
          }
        }

        @keyframes iosLoadingBar {
          0% {
            transform: translateX(-130%);
          }

          50% {
            transform: translateX(120%);
          }

          100% {
            transform: translateX(260%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [role="status"] * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}