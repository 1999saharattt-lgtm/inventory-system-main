import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/* =========================================================
   FORM FIELD
   iOS-Inspired Global Form Components

   ใช้เป็นมาตรฐานช่องกรอกข้อมูลทั้งระบบ

   COMPONENTS
   - FormField
   - FormInput
   - FormSelect
   - FormTextarea

   DESIGN
   - iOS-inspired
   - Soft Surface
   - Rounded Corners
   - Focus Ring แบบ iOS
   - รองรับ Error / Help Text
   - Responsive
   - ใช้ได้กับ Server Component

   IMPORTANT
   - UI เท่านั้น
   - ไม่แตะ Database
   - ไม่แตะ Prisma
   - ไม่แตะ API
   - ไม่เปลี่ยน name ของ Form
   - ไม่เปลี่ยน Business Logic
========================================================= */

/* =========================================================
   FORM FIELD
========================================================= */

type FormFieldProps = {
  label?: ReactNode;

  htmlFor?: string;

  required?: boolean;

  description?: ReactNode;

  error?: ReactNode;

  children: ReactNode;

  className?: string;
};

export function FormField({
  label,
  htmlFor,
  required = false,
  description,
  error,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div
      className={`
        min-w-0
        ${className}
      `}
    >
      {/* =====================================================
          LABEL
      ===================================================== */}

      {label !== undefined && label !== null && (
        <label
          htmlFor={htmlFor}
          className="
            flex
            min-w-0
            items-center
            gap-1.5

            text-sm
            font-extrabold
            leading-tight

            !text-slate-700

            sm:text-base
          "
        >
          <span className="min-w-0 break-words">
            {label}
          </span>

          {required && (
            <span
              className="
                shrink-0
                !text-red-500
              "
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      {/* =====================================================
          CONTROL
      ===================================================== */}

      <div className={label ? "mt-2" : ""}>
        {children}
      </div>

      {/* =====================================================
          DESCRIPTION
      ===================================================== */}

      {description !== undefined &&
        description !== null &&
        !error && (
          <p
            className="
              mt-1.5
              break-words
              text-sm
              font-semibold
              leading-snug
              !text-slate-500
            "
          >
            {description}
          </p>
        )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error !== undefined && error !== null && (
        <p
          className="
            mt-1.5
            break-words
            text-sm
            font-extrabold
            leading-snug
            !text-red-600
          "
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   SHARED CONTROL CLASS
========================================================= */

const controlClassName = `
  block

  min-h-[50px]
  w-full
  min-w-0

  rounded-[14px]

  border
  border-slate-200/90

  bg-white/95

  px-4
  py-3

  text-base
  font-bold
  leading-normal

  !text-slate-900

  outline-none

  shadow-[0_2px_8px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.9)]

  backdrop-blur-xl
  backdrop-saturate-150

  transition-[border-color,box-shadow,background-color,transform]
  duration-200
  ease-out

  placeholder:!text-slate-400

  hover:border-slate-300

  focus:border-blue-500/80
  focus:bg-white
  focus:shadow-[0_0_0_4px_rgba(59,130,246,0.12),0_4px_14px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,1)]

  disabled:cursor-not-allowed
  disabled:border-slate-200
  disabled:bg-slate-100/80
  disabled:!text-slate-500
  disabled:shadow-none

  read-only:bg-slate-50
`;

/* =========================================================
   FORM INPUT
========================================================= */

type FormInputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    hasError?: boolean;
  };

export function FormInput({
  className = "",
  hasError = false,
  ...props
}: FormInputProps) {
  return (
    <input
      {...props}
      className={`
        ${controlClassName}

        ${
          hasError
            ? `
              !border-red-400

              focus:!border-red-500
              focus:!shadow-[0_0_0_4px_rgba(239,68,68,0.12),0_4px_14px_rgba(15,23,42,0.07)]
            `
            : ""
        }

        ${className}
      `}
    />
  );
}

/* =========================================================
   FORM SELECT
========================================================= */

type FormSelectProps =
  SelectHTMLAttributes<HTMLSelectElement> & {
    hasError?: boolean;
    children: ReactNode;
  };

export function FormSelect({
  className = "",
  hasError = false,
  children,
  ...props
}: FormSelectProps) {
  return (
    <div className="relative min-w-0">
      <select
        {...props}
        className={`
          ${controlClassName}

          appearance-none

          pr-11

          ${
            hasError
              ? `
                !border-red-400

                focus:!border-red-500
                focus:!shadow-[0_0_0_4px_rgba(239,68,68,0.12),0_4px_14px_rgba(15,23,42,0.07)]
              `
              : ""
          }

          ${className}
        `}
      >
        {children}
      </select>

      {/* =====================================================
          SELECT ARROW
      ===================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          right-4
          top-1/2

          flex
          h-6
          w-6

          -translate-y-1/2

          items-center
          justify-center

          !text-slate-500
        "
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
        >
          <path
            d="M5.5 7.5L10 12L14.5 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}

/* =========================================================
   FORM TEXTAREA
========================================================= */

type FormTextareaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    hasError?: boolean;
  };

export function FormTextarea({
  className = "",
  hasError = false,
  rows = 4,
  ...props
}: FormTextareaProps) {
  return (
    <textarea
      {...props}
      rows={rows}
      className={`
        ${controlClassName}

        min-h-[120px]

        resize-y

        ${
          hasError
            ? `
              !border-red-400

              focus:!border-red-500
              focus:!shadow-[0_0_0_4px_rgba(239,68,68,0.12),0_4px_14px_rgba(15,23,42,0.07)]
            `
            : ""
        }

        ${className}
      `}
    />
  );
}