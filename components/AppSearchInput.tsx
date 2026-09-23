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
      <div
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          rounded-[24px]
          border
          border-white/80
          bg-white/75
          p-4
          shadow-[0_20px_55px_-30px_rgba(15,23,42,0.35)]
          backdrop-blur-2xl
          sm:p-5
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
            -top-20
            h-48
            w-48
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
            -bottom-24
            right-0
            h-48
            w-48
            rounded-full
            bg-cyan-400/10
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
            min-w-0
            flex-col
            gap-3
            lg:flex-row
            lg:items-center
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
            {/* Search Icon */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-y-0
                left-4
                z-10
                flex
                items-center
                justify-center
                !text-slate-500
              "
            >
              {leftIcon ?? (
                <Search
                  size={20}
                  strokeWidth={2.3}
                />
              )}
            </div>

            {/* Input */}

            <input
              type="search"
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              disabled={disabled}
              autoFocus={autoFocus}
              autoComplete="off"
              className={`
                h-12
                w-full
                min-w-0
                rounded-[16px]
                border
                border-slate-300
                bg-white/90
                py-3
                pl-12
                pr-4
                text-base
                font-bold
                !text-slate-900
                shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]
                outline-none
                transition-all
                duration-300

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

                ${inputClassName}
              `}
            />
          </div>

          {/* ===============================================
              SEARCH BUTTON

              ใช้ AppButton ตัวกลางของระบบ
          =============================================== */}

          {showSearchButton && (
            <AppButton
              type="submit"
              variant="secondary"
              size="lg"
              disabled={disabled}
              icon={
                <Search
                  size={18}
                  strokeWidth={2.4}
                />
              }
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
                h-12
                shrink-0
                items-center
                justify-center
                gap-2
                rounded-[16px]
                border
                border-slate-300
                bg-slate-100/80
                px-4
                text-sm
                font-extrabold
                !text-slate-700
                shadow-sm
                backdrop-blur-xl
                sm:px-5
              "
            >
              <span
                className="
                  flex
                  h-7
                  min-w-7
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-slate-300
                  bg-white
                  px-2
                  text-xs
                  font-black
                  !text-slate-900
                  shadow-sm
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

              ใช้ AppButton ตัวกลางของระบบ
          =============================================== */}

          {showClearButton &&
            value.trim() !== "" && (
              <AppButton
                type="button"
                variant="outline"
                size="lg"
                disabled={disabled}
                onClick={handleClear}
                icon={
                  <X
                    size={18}
                    strokeWidth={2.4}
                  />
                }
              >
                {clearButtonText}
              </AppButton>
            )}
        </div>
      </div>
    </form>
  );
}