"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

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

  options: AppSearchableSelectOption[];

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

type PanelPosition = {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
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

  const [
    mounted,
    setMounted,
  ] = useState(false);

  const [
    panelPosition,
    setPanelPosition,
  ] = useState<PanelPosition | null>(
    null
  );

  /* =======================================================
     REFS
  ======================================================= */

  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const controlRef =
    useRef<HTMLButtonElement>(
      null
    );

  const panelRef =
    useRef<HTMLDivElement>(
      null
    );

  const searchInputRef =
    useRef<HTMLInputElement>(
      null
    );

  /* =======================================================
     MOUNT
  ======================================================= */

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =======================================================
     SELECTED OPTION
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
     PANEL POSITION

     ใช้ fixed + Portal
     จึงไม่โดน overflow / z-index ของ AppCard บัง
  ======================================================= */

  const updatePanelPosition =
    useCallback(() => {
      const control =
        controlRef.current;

      if (!control) {
        return;
      }

      const rect =
        control.getBoundingClientRect();

      const viewportWidth =
        window.innerWidth;

      const viewportHeight =
        window.innerHeight;

      const pagePadding =
        12;

      const gap =
        8;

      const spaceBelow =
        viewportHeight -
        rect.bottom -
        pagePadding;

      const spaceAbove =
        rect.top -
        pagePadding;

      const openUpward =
        spaceBelow < 280 &&
        spaceAbove >
          spaceBelow;

      const availableHeight =
        openUpward
          ? spaceAbove -
            gap
          : spaceBelow -
            gap;

      const maxHeight =
        Math.max(
          180,
          Math.min(
            380,
            availableHeight
          )
        );

      const maxWidth =
        Math.max(
          0,
          viewportWidth -
            pagePadding *
              2
        );

      const width =
        Math.min(
          rect.width,
          maxWidth
        );

      const left =
        Math.min(
          Math.max(
            rect.left,
            pagePadding
          ),
          Math.max(
            pagePadding,
            viewportWidth -
              width -
              pagePadding
          )
        );

      if (
        openUpward
      ) {
        setPanelPosition({
          left,
          width,
          bottom:
            viewportHeight -
            rect.top +
            gap,
          maxHeight,
        });

        return;
      }

      setPanelPosition({
        left,
        width,
        top:
          rect.bottom +
          gap,
        maxHeight,
      });
    }, []);

  /* =======================================================
     POSITION EVENTS
  ======================================================= */

  useEffect(() => {
    if (!open) {
      setPanelPosition(
        null
      );

      return;
    }

    updatePanelPosition();

    window.addEventListener(
      "resize",
      updatePanelPosition
    );

    window.addEventListener(
      "scroll",
      updatePanelPosition,
      true
    );

    return () => {
      window.removeEventListener(
        "resize",
        updatePanelPosition
      );

      window.removeEventListener(
        "scroll",
        updatePanelPosition,
        true
      );
    };
  }, [
    open,
    updatePanelPosition,
  ]);

  /* =======================================================
     AUTO FOCUS
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
     CLICK OUTSIDE
  ======================================================= */

  useEffect(() => {
    function handlePointerDown(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      const insideControl =
        containerRef.current?.contains(
          target
        );

      const insidePanel =
        panelRef.current?.contains(
          target
        );

      if (
        insideControl ||
        insidePanel
      ) {
        return;
      }

      setOpen(false);
      setSearch("");
    }

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
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
     PANEL
  ======================================================= */

  const panel =
    open &&
    mounted &&
    panelPosition
      ? createPortal(
          <div
            ref={
              panelRef
            }
            role="listbox"
            style={{
              position:
                "fixed",

              left:
                panelPosition.left,

              width:
                panelPosition.width,

              top:
                panelPosition.top,

              bottom:
                panelPosition.bottom,

              maxHeight:
                panelPosition.maxHeight,

              zIndex:
                999999,
            }}
            className="
              flex
              min-w-0
              flex-col

              overflow-hidden

              rounded-[18px]

              border
              border-slate-200/90

              bg-white/95

              shadow-[0_22px_60px_-18px_rgba(15,23,42,0.38)]

              backdrop-blur-2xl
              backdrop-saturate-150
            "
          >
            {/* =============================================
                SEARCH
            ============================================= */}

            <div
              className="
                shrink-0

                border-b
                border-slate-200/70

                bg-white/90

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
                  duration-200

                  placeholder:!text-slate-400

                  hover:border-slate-400

                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              />
            </div>

            {/* =============================================
                OPTIONS
            ============================================= */}

            <div
              className="
                min-h-0
                flex-1

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
                          duration-150

                          ${
                            isSelected
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          }
                        `}
                      >
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
                                ? "bg-blue-600 !text-white"
                                : "bg-slate-100 !text-slate-400"
                            }
                          `}
                        >
                          {isSelected
                            ? "✓"
                            : ""}
                        </span>

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
          </div>,
          document.body
        )
      : null;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
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

        <button
          ref={
            controlRef
          }
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
          className="
            flex
            min-h-[52px]
            w-full
            min-w-0

            items-center
            justify-between

            gap-3

            rounded-[16px]

            border
            border-slate-300/90

            bg-white/90

            px-4
            py-3

            text-left
            text-sm
            font-bold

            shadow-[0_7px_20px_-16px_rgba(15,23,42,0.45)]

            backdrop-blur-xl

            outline-none

            transition-all
            duration-200

            hover:border-slate-400
            hover:bg-white

            focus:border-blue-500
            focus:ring-4
            focus:ring-blue-500/10

            disabled:cursor-not-allowed
            disabled:bg-slate-100
            disabled:opacity-70
          "
        >
          <span
            className="
              min-w-0
              flex-1
            "
          >
            <span
              className={`
                block
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
            </span>

            {selectedOption
              ?.description && (
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
                  selectedOption.description
                }
              </span>
            )}
          </span>

          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`
              h-4
              w-4
              shrink-0

              !text-slate-500

              transition-transform
              duration-200

              ${
                open
                  ? "rotate-180"
                  : "rotate-0"
              }
            `}
          >
            <path d="m5 7.5 5 5 5-5" />
          </svg>
        </button>
      </div>

      {panel}
    </>
  );
}