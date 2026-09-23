"use client";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  Search,
  X,
} from "lucide-react";

import AppButton from "@/components/AppButton";

/* =========================================================
   TYPES
========================================================= */

type AppSearchInputProps = {
  value: string;

  onChange: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;

  onSubmit?: (
    event: FormEvent<HTMLFormElement>
  ) => void;

  onClear?: () => void;

  placeholder?: string;

  resultCount?: number;

  resultLabel?: string;

  disabled?: boolean;

  autoFocus?: boolean;

  className?: string;

  inputClassName?: string;

  showSearchButton?: boolean;

  showClearButton?: boolean;

  searchButtonText?: string;

  clearButtonText?: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AppSearchInput({
  value,
  onChange,
  onSubmit,

  onClear,

  placeholder = "ค้นหา...",

  resultCount,

  resultLabel = "รายการ",

  disabled = false,

  autoFocus = false,

  className = "",

  inputClassName = "",

  showSearchButton = true,

  showClearButton = true,

  searchButtonText = "ค้นหา",

  clearButtonText = "ล้าง",
}: AppSearchInputProps) {
  /* =======================================================
     SUBMIT
  ======================================================= */

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    onSubmit?.(event);
  }

  /* =======================================================
     CLEAR
  ======================================================= */

  function handleClear() {
    if (disabled) {
      return;
    }

    onClear?.();
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        w-full
        min-w-0

        ${className}
      `}
    >
      {/* ===================================================
          SEARCH CARD
      =================================================== */}

      <div
        className="
          relative

          w-full
          min-w-0

          overflow-hidden

          rounded-[22px]

          border
          border-white/80

          bg-white/80

          p-3

          shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]

          backdrop-blur-2xl

          sm:p-3
        "
      >
        {/* =================================================
            AMBIENT BACKGROUND
        ================================================= */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            -left-20
            -top-24

            h-44
            w-44

            rounded-full

            bg-blue-400/[0.08]

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            -bottom-24
            absolute
            right-0

            h-44
            w-44

            rounded-full

            bg-cyan-400/[0.08]

            blur-3xl
          "
        />

        {/* =================================================
            SEARCH ROW
        ================================================= */}

        <div
          className="
            relative

            flex
            w-full
            min-w-0

            flex-col

            gap-2.5

            md:flex-row
            md:items-center
          "
        >
          {/* ===============================================
              SEARCH INPUT
              ไม่มีไอคอนแว่นขยายภายในช่อง
          =============================================== */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <input
              type="search"
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              autoFocus={autoFocus}
              autoComplete="off"
              aria-label={placeholder}
              className={`
                h-11

                w-full
                min-w-0

                rounded-[14px]

                border
                border-slate-300

                bg-white

                px-4

                text-sm
                font-bold
                !text-slate-900

                shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]

                outline-none

                transition-all
                duration-200

                placeholder:font-semibold
                placeholder:!text-slate-400

                hover:border-slate-400

                focus:border-blue-500
                focus:bg-white

                focus:ring-4
                focus:ring-blue-500/10

                disabled:cursor-not-allowed
                disabled:bg-slate-100
                disabled:!text-slate-400
                disabled:opacity-70

                sm:h-12
                sm:text-base

                ${inputClassName}
              `}
            />
          </div>

          {/* ===============================================
              ACTION AREA
          =============================================== */}

          <div
            className="
              flex
              min-w-0

              flex-wrap
              items-center

              gap-2

              md:flex-nowrap
              md:shrink-0
            "
          >
            {/* =============================================
                SEARCH BUTTON
            ============================================= */}

            {showSearchButton && (
              <AppButton
                type="submit"
                variant="primary"
                size="md"
                disabled={disabled}
                icon={
                  <Search
                    size={17}
                    strokeWidth={2.5}
                  />
                }
                className="
                  flex-1
                  sm:flex-none
                "
              >
                {searchButtonText}
              </AppButton>
            )}

            {/* =============================================
                RESULT COUNT
            ============================================= */}

            {typeof resultCount ===
              "number" && (
              <div
                className="
                  inline-flex

                  h-11
                  shrink-0

                  items-center
                  justify-center

                  gap-2

                  rounded-[14px]

                  border
                  border-slate-300

                  bg-slate-50

                  px-3

                  text-xs
                  font-extrabold
                  !text-slate-600

                  shadow-sm

                  sm:h-12
                  sm:px-4
                  sm:text-sm
                "
              >
                <span
                  className="
                    inline-flex

                    h-7
                    min-w-7

                    items-center
                    justify-center

                    rounded-full

                    border
                    border-slate-300

                    bg-white

                    px-2

                    text-[11px]
                    font-black
                    tabular-nums
                    !text-slate-800

                    shadow-sm
                  "
                >
                  {resultCount.toLocaleString(
                    "th-TH"
                  )}
                </span>

                <span
                  className="
                    whitespace-nowrap
                  "
                >
                  {resultLabel}
                </span>
              </div>
            )}

            {/* =============================================
                CLEAR BUTTON
            ============================================= */}

            {showClearButton &&
              value.trim() !== "" && (
                <AppButton
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={disabled}
                  onClick={handleClear}
                  icon={
                    <X
                      size={17}
                      strokeWidth={2.4}
                    />
                  }
                  className="
                    flex-1
                    sm:flex-none
                  "
                >
                  {clearButtonText}
                </AppButton>
              )}
          </div>
        </div>
      </div>
    </form>
  );
}