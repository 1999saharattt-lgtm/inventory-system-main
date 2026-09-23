"use client";

import {
  Search,
  X,
} from "lucide-react";

type AppSearchInputProps = {
  value: string;
  onChange: (value: string) => void;

  placeholder?: string;

  onSubmit?: () => void;
  onClear?: () => void;

  resultCount?: number;
  resultLabel?: string;

  className?: string;
};

export default function AppSearchInput({
  value,
  onChange,

  placeholder = "ค้นหา...",

  onSubmit,
  onClear,

  resultCount,
  resultLabel = "รายการ",

  className = "",
}: AppSearchInputProps) {
  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    onSubmit?.();
  }

  function handleClear() {
    onChange("");
    onClear?.();
  }

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
          border-slate-200

          bg-white

          p-4

          shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]

          sm:p-5
        "
      >
        {/* ===================================================
            AMBIENT
        =================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-20
            -top-24

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

        {/* ===================================================
            CONTENT
        =================================================== */}

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
          {/* =================================================
              INPUT
          ================================================= */}

          <div
            className="
              relative
              min-w-0
              flex-1
            "
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none

                absolute
                inset-y-0
                left-0

                flex
                w-12
                items-center
                justify-center

                !text-slate-400
              "
            >
              <Search
                size={20}
                strokeWidth={2.3}
              />
            </div>

            <input
              type="search"
              value={value}
              onChange={(event) =>
                onChange(
                  event.target.value
                )
              }
              placeholder={placeholder}
              autoComplete="off"
              className="
                h-12
                w-full
                min-w-0

                rounded-[16px]

                border
                border-slate-300

                bg-slate-50

                py-3
                pl-12
                pr-11

                text-base
                font-bold
                !text-slate-900

                outline-none

                transition-all
                duration-200

                placeholder:font-semibold
                placeholder:!text-slate-400

                hover:border-slate-400
                hover:bg-white

                focus:border-blue-500
                focus:bg-white
                focus:ring-4
                focus:ring-blue-500/10
              "
            />

            {/* ===============================================
                CLEAR ICON
            =============================================== */}

            {value && (
              <button
                type="button"
                aria-label="ล้างคำค้นหา"
                title="ล้างคำค้นหา"
                onClick={handleClear}
                className="
                  absolute
                  inset-y-0
                  right-1.5

                  my-auto

                  flex
                  h-9
                  w-9
                  items-center
                  justify-center

                  rounded-[12px]

                  !text-slate-400

                  transition-all
                  duration-200

                  hover:bg-slate-200
                  hover:!text-slate-700

                  active:scale-95
                "
              >
                <X
                  size={18}
                  strokeWidth={2.5}
                />
              </button>
            )}
          </div>

          {/* =================================================
              SEARCH BUTTON
          ================================================= */}

          <button
            type="submit"
            className="
              inline-flex
              h-12
              shrink-0
              items-center
              justify-center
              gap-2

              rounded-[16px]

              bg-gradient-to-r
              from-slate-800
              to-slate-700

              px-5

              text-sm
              font-extrabold
              !text-white

              shadow-[0_12px_24px_-16px_rgba(15,23,42,0.65)]

              transition-all
              duration-200

              hover:-translate-y-0.5
              hover:from-slate-700
              hover:to-slate-600

              active:translate-y-0
              active:scale-[0.97]

              sm:text-base
            "
          >
            <Search
              size={18}
              strokeWidth={2.4}
            />

            <span>
              ค้นหา
            </span>
          </button>

          {/* =================================================
              RESULT COUNT
          ================================================= */}

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
                border-slate-200

                bg-slate-50

                px-4

                text-sm
                font-extrabold
                !text-slate-600
              "
            >
              <span
                className="
                  inline-flex
                  min-w-7
                  items-center
                  justify-center

                  rounded-full

                  bg-white

                  px-2
                  py-1

                  text-xs
                  font-black
                  !text-slate-900

                  shadow-sm
                  ring-1
                  ring-slate-200
                "
              >
                {resultCount.toLocaleString(
                  "th-TH"
                )}
              </span>

              <span>
                {resultLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}