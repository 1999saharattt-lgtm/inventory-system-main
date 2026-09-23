import type {
  HTMLAttributes,
  ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

export type AppInfoCardProps = {
  /*
   * รูปแบบมาตรฐาน
   *
   * <AppInfoCard
   *   label="วันที่รับเข้า"
   *   value="22 กันยายน 2569"
   * />
   */
  label?: ReactNode;
  value?: ReactNode;

  /*
   * รองรับการใส่เนื้อหาเอง
   *
   * <AppInfoCard>
   *   ...
   * </AppInfoCard>
   */
  children?: ReactNode;

  /*
   * Icon ด้านหน้าหัวข้อ
   */
  icon?: ReactNode;

  className?: string;
  contentClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
} & Omit<
  HTMLAttributes<HTMLDivElement>,
  | "children"
  | "className"
>;

/* =========================================================
   APP INFO CARD
========================================================= */

export default function AppInfoCard({
  label,
  value,
  children,
  icon,

  className = "",
  contentClassName = "",
  labelClassName = "",
  valueClassName = "",

  ...props
}: AppInfoCardProps) {
  const hasCustomContent =
    children !== undefined &&
    children !== null;

  return (
    <div
      {...props}
      className={`
        group

        relative

        flex
        min-h-[96px]
        w-full
        min-w-0
        flex-col
        justify-center

        overflow-hidden

        rounded-[20px]

        border
        border-white/90

        bg-gradient-to-br
        from-white/95
        via-white/90
        to-slate-50/85

        px-4
        py-3.5

        shadow-[0_14px_36px_-22px_rgba(15,23,42,0.42),inset_0_1px_0_rgba(255,255,255,0.98)]

        ring-1
        ring-slate-900/[0.06]

        backdrop-blur-xl

        transition-all
        duration-300
        ease-out

        hover:-translate-y-[1px]

        hover:shadow-[0_18px_42px_-22px_rgba(15,23,42,0.48),inset_0_1px_0_rgba(255,255,255,1)]

        ${className}
      `}
    >
      {/* =====================================================
          IOS AMBIENT LIGHT
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -right-10
          -top-10

          h-24
          w-24

          rounded-full

          bg-blue-400/[0.07]

          blur-2xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -bottom-12
          -left-10

          h-24
          w-24

          rounded-full

          bg-cyan-400/[0.05]

          blur-2xl
        "
      />

      {/* =====================================================
          TOP GLASS HIGHLIGHT
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          inset-x-4
          top-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white
          to-transparent
        "
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        className={`
          relative
          z-10

          w-full
          min-w-0

          ${contentClassName}
        `}
      >
        {hasCustomContent ? (
          children
        ) : (
          <>
            {/* =================================================
                LABEL
            ================================================= */}

            {(label !== undefined ||
              icon !== undefined) && (
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-2
                "
              >
                {icon !== undefined && (
                  <span
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center

                      rounded-[9px]

                      border
                      border-white/90

                      bg-white/75

                      text-sm

                      shadow-sm

                      ring-1
                      ring-slate-900/[0.05]

                      backdrop-blur-xl
                    "
                  >
                    {icon}
                  </span>
                )}

                {label !== undefined && (
                  <p
                    className={`
                      min-w-0

                      text-sm
                      font-extrabold
                      !text-slate-500

                      ${labelClassName}
                    `}
                  >
                    {label}
                  </p>
                )}
              </div>
            )}

            {/* =================================================
                VALUE
            ================================================= */}

            {value !== undefined && (
              <div
                className={`
                  ${
                    label !== undefined ||
                    icon !== undefined
                      ? "mt-1.5"
                      : ""
                  }

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
                {value}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}