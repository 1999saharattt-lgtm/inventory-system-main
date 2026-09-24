"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* =========================================================
   TYPES
========================================================= */

export type AppSearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
};

type Props = {
  id?: string;

  value: string;

  options:
    AppSearchableSelectOption[];

  placeholder?: string;

  searchPlaceholder?: string;

  emptyText?: string;

  disabled?: boolean;

  required?: boolean;

  onChange: (
    value: string
  ) => void;

  className?: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AppSearchableSelect({
  id,
  value,
  options,
  placeholder = "กรุณาเลือกข้อมูล",
  searchPlaceholder = "พิมพ์เพื่อค้นหา...",
  emptyText = "ไม่พบข้อมูล",
  disabled = false,
  required = false,
  onChange,
  className = "",
}: Props) {
  /* =======================================================
     STATE
  ======================================================= */

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  /* =======================================================
     REFS
  ======================================================= */

  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const searchInputRef =
    useRef<HTMLInputElement>(
      null
    );

  /* =======================================================
     SELECTED
  ======================================================= */

  const selectedOption =
    useMemo(
      () =>
        options.find(
          (option) =>
            option.value ===
            value
        ),
      [
        options,
        value,
      ]
    );

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredOptions =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLocaleLowerCase(
            "th"
          );

      if (!keyword) {
        return options;
      }

      return options.filter(
        (option) => {
          const searchableText =
            [
              option.label,
              option.description,
              option.value,
            ]
              .filter(Boolean)
              .join(" ")
              .toLocaleLowerCase(
                "th"
              );

          return searchableText.includes(
            keyword
          );
        }
      );
    }, [
      options,
      search,
    ]);

  /* =======================================================
     CLICK OUTSIDE
  ======================================================= */

  useEffect(() => {
    function handleMouseDown(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener(
      "mousedown",
      handleMouseDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMouseDown
      );
    };
  }, []);

  /* =======================================================
     ESCAPE
  ======================================================= */

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* =======================================================
     AUTO FOCUS SEARCH
  ======================================================= */

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          searchInputRef.current?.focus();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    open,
  ]);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      ref={
        containerRef
      }
      className={`
        relative
        w-full
        min-w-0

        ${className}
      `}
    >
      {/* ===================================================
          REQUIRED FIELD
      =================================================== */}

      {required && (
        <input
          tabIndex={
            -1
          }
          aria-hidden="true"
          value={
            value
          }
          onChange={() => {}}
          required
          className="
            pointer-events-none
            absolute

            h-px
            w-px

            opacity-0
          "
        />
      )}

      {/* ===================================================
          CONTROL
      =================================================== */}

      <button
        id={
          id
        }
        type="button"
        disabled={
          disabled
        }
        aria-haspopup="listbox"
        aria-expanded={
          open
        }
        onClick={() => {
          if (
            disabled
          ) {
            return;
          }

          setOpen(
            (
              current
            ) =>
              !current
          );
        }}
        className={`
          flex
          min-h-[52px]
          w-full
          min-w-0

          items-center
          justify-between

          gap-3

          rounded-[16px]

          border
          border-slate-300

          bg-white/95

          px-4
          py-3

          text-left
          text-sm
          font-bold

          shadow-sm

          outline-none

          transition-all
          duration-200

          hover:border-slate-400
          hover:bg-white

          focus:border-emerald-500
          focus:ring-4
          focus:ring-emerald-500/10

          disabled:cursor-not-allowed
          disabled:bg-slate-100
          disabled:opacity-70
        `}
      >
        {/* ===============================================
            TEXT
        =============================================== */}

        <div
          className="
            min-w-0
            flex-1
          "
        >
          <div
            className={`
              truncate

              ${
                selectedOption
                  ? "!text-slate-900"
                  : "!text-slate-400"
              }
            `}
          >
            {selectedOption
              ?.label ??
              placeholder}
          </div>

          {selectedOption
            ?.description && (
            <div
              className="
                mt-0.5

                truncate

                text-xs
                font-semibold

                !text-slate-500
              "
            >
              {
                selectedOption.description
              }
            </div>
          )}
        </div>

        {/* ===============================================
            ARROW

            ปิด = ▼
            เปิด = ▲
            ใช้ rotate เหมือน Dropdown หน้าอื่น
        =============================================== */}

        <span
          aria-hidden="true"
          className={`
            shrink-0

            text-xs
            !text-slate-600

            transition-transform
            duration-200

            ${
              open
                ? "rotate-180"
                : ""
            }
          `}
        >
          ▼
        </span>
      </button>

      {/* ===================================================
          PANEL
      =================================================== */}

      {open &&
        !disabled && (
          <div
            role="listbox"
            className="
              absolute
              inset-x-0
              top-[calc(100%+8px)]
              z-[200]

              overflow-hidden

              rounded-[18px]

              border
              border-slate-200

              bg-white/95

              shadow-2xl
              shadow-slate-900/15

              backdrop-blur-xl
              backdrop-saturate-150
            "
          >
            {/* =============================================
                SEARCH
            ============================================= */}

            <div
              className="
                border-b
                border-slate-100

                p-2.5
              "
            >
              <input
                ref={
                  searchInputRef
                }
                type="text"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder={
                  searchPlaceholder
                }
                autoComplete="off"
                className="
                  h-11
                  w-full

                  rounded-[13px]

                  border
                  border-slate-300

                  bg-white

                  px-3.5

                  text-sm
                  font-semibold

                  !text-slate-900

                  outline-none

                  transition-all

                  placeholder:!text-slate-400

                  focus:border-emerald-500
                  focus:ring-4
                  focus:ring-emerald-500/10
                "
              />
            </div>

            {/* =============================================
                OPTIONS
            ============================================= */}

            <div
              className="
                max-h-[280px]

                overflow-y-auto

                p-1.5
              "
            >
              {filteredOptions.length ===
              0 ? (
                <div
                  className="
                    px-4
                    py-6

                    text-center
                    text-sm
                    font-semibold

                    !text-slate-500
                  "
                >
                  {
                    emptyText
                  }
                </div>
              ) : (
                filteredOptions.map(
                  (
                    option
                  ) => {
                    const isSelected =
                      option.value ===
                      value;

                    return (
                      <button
                        key={
                          option.value
                        }
                        type="button"
                        role="option"
                        aria-selected={
                          isSelected
                        }
                        onClick={() => {
                          onChange(
                            option.value
                          );

                          setOpen(
                            false
                          );

                          setSearch(
                            ""
                          );
                        }}
                        className={`
                          flex
                          w-full
                          min-w-0

                          items-center

                          gap-3

                          rounded-[13px]

                          px-3
                          py-2.5

                          text-left

                          transition-colors

                          ${
                            isSelected
                              ? "bg-emerald-50"
                              : "hover:bg-slate-50"
                          }
                        `}
                      >
                        {/* =================================
                            CHECK
                        ================================= */}

                        <span
                          aria-hidden="true"
                          className={`
                            grid
                            h-6
                            w-6
                            shrink-0

                            place-items-center

                            rounded-full

                            text-xs
                            font-black

                            ${
                              isSelected
                                ? "bg-emerald-600 !text-white"
                                : "bg-slate-100 !text-slate-400"
                            }
                          `}
                        >
                          {isSelected
                            ? "✓"
                            : ""}
                        </span>

                        {/* =================================
                            LABEL
                        ================================= */}

                        <span
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <span
                            className="
                              block

                              truncate

                              text-sm
                              font-extrabold

                              !text-slate-900
                            "
                          >
                            {
                              option.label
                            }
                          </span>

                          {option.description && (
                            <span
                              className="
                                mt-0.5
                                block

                                truncate

                                text-xs
                                font-semibold

                                !text-slate-500
                              "
                            >
                              {
                                option.description
                              }
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </div>
        )}
    </div>
  );
}