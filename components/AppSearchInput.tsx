"use client";

import type {
  ChangeEvent,
  FormEvent,
  ReactNode,
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

  leftIcon?: ReactNode;

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

  leftIcon,

  showSearchButton = true,

  showClearButton = true,

  searchButtonText = "ค้นหา",

  clearButtonText = "ล้างการค้นหา",
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

          rounded-[20px]

          border
          border-slate-200

          bg-white/90

          p-2.5

          shadow-[0_14px_36px_-28px_rgba(15,23,42,0.35)]

          backdrop-blur-xl

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
            -left-16
            -top-20

            h-36
            w-36

            rounded-full

            bg-blue-400/[0.07]

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            -bottom-20
            right-0

            h-36
            w-36

            rounded-full

            bg-cyan-400/[0.06]

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

            sm:flex-row
            sm:items-center
          "
        >
          {/* ===============================================
              INPUT
          =============================================== */}

          <div
            className="
              relative
              min-w-0
              flex-1
            "
          >
            {/* SEARCH ICON */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none

                absolute
                inset-y-0
                left-3.5
                z-10

                flex
                items-center
                justify-center

                !text-slate-500
              "
            >
              {leftIcon ?? (
                <Search
                  size={18}
                  strokeWidth={2.3}
                />
              )}
            </div>

            {/* INPUT */}

            <input
              type="search"
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              autoFocus={autoFocus}
              autoComplete="off"
              className={`
                h-11
                w-full
                min-w-0

                rounded-[14px]

                border
                border-slate-300

                bg-white

                py-2
                pl-11
                pr-4

                text-sm
                font-bold
                !text-slate-900

                shadow-sm

                outline-none

                transition-all
                duration-200

                placeholder:font-semibold
                placeholder:!text-slate-400

                hover:border-slate-400

                focus:border-blue-400
                focus:bg-white
                focus:ring-4
                focus:ring-blue-100/70

                disabled:cursor-not-allowed
                disabled:bg-slate-100
                disabled:!text-slate-400
                disabled:opacity-70

                sm:text-base

                ${inputClassName}
              `}
            />
          </div>

          {/* ===============================================
              SEARCH BUTTON
          =============================================== */}

          {showSearchButton && (
            <AppButton
              type="submit"
              variant="primary"
              size="md"
              disabled={disabled}
              icon={
                <Search
                  size={17}
                  strokeWidth={2.4}
                />
              }
              className="
                w-full
                shrink-0

                sm:w-auto
              "
            >
              {searchButtonText}
            </AppButton>
          )}

          {/* ===============================================
              RESULT COUNT
          =============================================== */}

          {typeof resultCount ===
            "number" && (
            <div
              className="
                inline-flex
                h-11
                w-full
                shrink-0

                items-center
                justify-center
                gap-2

                rounded-[14px]

                border
                border-slate-300

                bg-slate-50

                px-3

                text-sm
                font-extrabold
                !text-slate-700

                shadow-sm

                sm:w-auto
                sm:px-4
              "
            >
              <span
                className="
                  flex
                  h-6
                  min-w-6

                  items-center
                  justify-center

                  rounded-full

                  border
                  border-slate-300

                  bg-white

                  px-1.5

                  text-xs
                  font-black
                  tabular-nums
                  !text-slate-900
                "
              >
                {resultCount.toLocaleString(
                  "th-TH"
                )}
              </span>

              <span className="whitespace-nowrap">
                {resultLabel}
              </span>
            </div>
          )}

          {/* ===============================================
              CLEAR BUTTON
          =============================================== */}

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
                  w-full
                  shrink-0

                  sm:w-auto
                "
              >
                {clearButtonText}
              </AppButton>
            )}
        </div>
      </div>
    </form>
  );
}