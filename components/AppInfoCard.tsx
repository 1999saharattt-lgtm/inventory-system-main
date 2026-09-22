import type {
  ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type AppInfoCardProps = {
  label: ReactNode;
  value: ReactNode;

  icon?: ReactNode;

  className?: string;
  valueClassName?: string;

  fullWidth?: boolean;
};

/* =========================================================
   APP INFO CARD

   มาตรฐานช่องข้อมูลของระบบ
   - กรอบดำ
   - iOS rounded
   - ความสูงมาตรฐาน
   - Glass / Soft Shadow
   - Label และ Value เป็นรูปแบบเดียวกันทุกหน้า
========================================================= */

export default function AppInfoCard({
  label,
  value,

  icon,

  className = "",
  valueClassName = "",

  fullWidth = false,
}: AppInfoCardProps) {
  return (
    <div
      className={`
        group

        relative

        flex
        min-h-[96px]
        min-w-0
        flex-col
        justify-center

        overflow-hidden

        rounded-[18px]

        border
        !border-black

        bg-white/90

        px-4
        py-3.5

        shadow-[0_10px_28px_-20px_rgba(15,23,42,0.45)]

        backdrop-blur-xl

        transition-all
        duration-200

        hover:-translate-y-[1px]

        hover:bg-white

        hover:shadow-[0_16px_34px_-22px_rgba(15,23,42,0.48)]

        ${
          fullWidth
            ? "md:col-span-2"
            : ""
        }

        ${className}
      `}
    >
      {/* ===================================================
          IOS LIGHT
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -right-8
          -top-8

          h-20
          w-20

          rounded-full

          bg-blue-300/[0.07]

          blur-2xl
        "
      />

      {/* ===================================================
          LABEL
      =================================================== */}

      <div
        className="
          relative
          z-10

          flex
          min-w-0
          items-center
          gap-2
        "
      >
        {icon && (
          <span
            className="
              flex
              h-7
              w-7
              shrink-0
              items-center
              justify-center

              rounded-[9px]

              bg-slate-100

              text-sm

              shadow-inner
            "
          >
            {icon}
          </span>
        )}

        <p
          className="
            min-w-0

            text-sm
            font-extrabold
            !text-slate-500
          "
        >
          {label}
        </p>
      </div>

      {/* ===================================================
          VALUE
      =================================================== */}

      <div
        className={`
          relative
          z-10

          mt-1.5

          min-w-0

          break-words

          text-base
          font-extrabold
          leading-relaxed
          !text-slate-900

          sm:text-lg

          ${valueClassName}
        `}
      >
        {value ?? "-"}
      </div>
    </div>
  );
}