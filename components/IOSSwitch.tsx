"use client";

import {
  useId,
  useState,
  type ChangeEvent,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type IOSSwitchProps = {
  name?: string;
  id?: string;

  label?: string;
  description?: string;

  defaultChecked?: boolean;
  checked?: boolean;

  disabled?: boolean;
  required?: boolean;

  value?: string;

  onChange?: (
    checked: boolean
  ) => void;

  className?: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function IOSSwitch({
  name,
  id,
  label,
  description,
  defaultChecked = false,
  checked,
  disabled = false,
  required = false,
  value = "true",
  onChange,
  className = "",
}: IOSSwitchProps) {
  const generatedId = useId();

  const inputId =
    id ??
    `ios-switch-${generatedId.replace(
      /:/g,
      ""
    )}`;

  const isControlled =
    typeof checked === "boolean";

  const [internalChecked, setInternalChecked] =
    useState(defaultChecked);

  const active = isControlled
    ? checked
    : internalChecked;

  /* =======================================================
     CHANGE
  ======================================================= */

  function handleChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const nextChecked =
      event.target.checked;

    if (!isControlled) {
      setInternalChecked(nextChecked);
    }

    onChange?.(nextChecked);
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className={`
        flex
        w-full
        min-w-0
        items-center
        justify-between
        gap-4

        rounded-[20px]

        border
        border-slate-200/80

        bg-white/80

        px-4
        py-3.5

        shadow-[0_4px_18px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]

        backdrop-blur-xl

        transition-all
        duration-300

        hover:border-slate-300
        hover:bg-white
        hover:shadow-[0_8px_24px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,1)]

        ${disabled
          ? "cursor-not-allowed opacity-60"
          : ""
        }

        ${className}
      `}
    >
      {/* ===================================================
          TEXT
      =================================================== */}

      {(label || description) && (
        <label
          htmlFor={inputId}
          className={`
            min-w-0
            flex-1

            ${
              disabled
                ? "cursor-not-allowed"
                : "cursor-pointer"
            }
          `}
        >
          {label && (
            <span
              className="
                block

                break-words

                text-base
                font-extrabold
                leading-tight

                !text-slate-900

                sm:text-lg
              "
            >
              {label}
            </span>
          )}

          {description && (
            <span
              className="
                mt-1
                block

                break-words

                text-sm
                font-semibold
                leading-relaxed

                !text-slate-500

                sm:text-base
              "
            >
              {description}
            </span>
          )}
        </label>
      )}

      {/* ===================================================
          SWITCH
      =================================================== */}

      <label
        htmlFor={inputId}
        className={`
          relative

          inline-flex

          h-[32px]
          w-[52px]

          shrink-0

          items-center

          rounded-full

          transition-all
          duration-300

          ${
            active
              ? `
                bg-emerald-500
                shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02),0_3px_10px_rgba(16,185,129,0.22)]
              `
              : `
                bg-slate-200
                shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]
              `
          }

          ${
            disabled
              ? "cursor-not-allowed"
              : "cursor-pointer"
          }

          active:scale-[0.96]
        `}
      >
        {/* =================================================
            REAL INPUT
        ================================================= */}

        <input
          id={inputId}
          name={name}
          type="checkbox"
          value={value}
          checked={
            isControlled
              ? checked
              : undefined
          }
          defaultChecked={
            isControlled
              ? undefined
              : defaultChecked
          }
          disabled={disabled}
          required={required}
          onChange={handleChange}
          className="
            peer

            absolute

            h-px
            w-px

            overflow-hidden

            opacity-0

            pointer-events-none
          "
        />

        {/* =================================================
            KNOB
        ================================================= */}

        <span
          aria-hidden="true"
          className={`
            absolute
            left-[2px]
            top-[2px]

            h-[28px]
            w-[28px]

            rounded-full

            bg-white

            shadow-[0_2px_7px_rgba(15,23,42,0.22),0_1px_2px_rgba(15,23,42,0.12)]

            transition-transform
            duration-300

            ease-[cubic-bezier(0.34,1.56,0.64,1)]

            ${
              active
                ? "translate-x-[20px]"
                : "translate-x-0"
            }
          `}
        />

        {/* =================================================
            HIGHLIGHT
        ================================================= */}

        <span
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            inset-x-2
            top-[2px]

            h-px

            rounded-full

            bg-white/40
          "
        />
      </label>
    </div>
  );
}