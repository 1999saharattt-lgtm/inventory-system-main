import type {
  ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type AppCardProps = {
  children: ReactNode;

  title?: string;
  subtitle?: string;

  icon?: ReactNode;
  actions?: ReactNode;

  className?: string;
  contentClassName?: string;

  padding?: boolean;
};

/* =========================================================
   APP CARD

   มาตรฐานการ์ดกลางของระบบ
   - iOS / Glass
   - มุมโค้ง
   - เงานุ่ม
   - ไม่มีเส้นดำใต้หัวข้อ
   - รองรับ icon / title / subtitle / actions
========================================================= */

export default function AppCard({
  children,

  title,
  subtitle,

  icon,
  actions,

  className = "",
  contentClassName = "",

  padding = true,
}: AppCardProps) {
  const hasHeader =
    Boolean(
      title ||
        subtitle ||
        icon ||
        actions
    );

  return (
    <section
      className={`
        relative

        w-full
        min-w-0

        overflow-hidden

        rounded-[28px]

        border
        border-slate-200/90

        bg-white/80

        shadow-[0_24px_70px_-36px_rgba(15,23,42,0.38)]

        ring-1
        ring-black/[0.025]

        backdrop-blur-2xl

        ${className}
      `}
    >
      {/* ===================================================
          IOS AMBIENT BACKGROUND
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -right-20
          -top-20

          h-52
          w-52

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
          -bottom-24
          -left-20

          h-56
          w-56

          rounded-full

          bg-cyan-400/[0.06]

          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          left-1/2
          top-8

          h-36
          w-72

          -translate-x-1/2

          rounded-full

          bg-slate-200/20

          blur-3xl
        "
      />

      {/* ===================================================
          HEADER
          ไม่มีเส้นคั่นด้านล่าง
      =================================================== */}

      {hasHeader && (
        <div
          className="
            relative
            z-10

            flex
            flex-col
            gap-3

            px-4
            pt-4

            sm:flex-row
            sm:items-center
            sm:justify-between

            sm:px-5
            sm:pt-5

            lg:px-6
            lg:pt-6
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            {icon && (
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center

                  rounded-[15px]

                  border
                  border-white/80

                  bg-white/85

                  text-xl

                  shadow-[0_8px_22px_-14px_rgba(15,23,42,0.45)]

                  ring-1
                  ring-slate-200/80

                  backdrop-blur-xl
                "
              >
                {icon}
              </div>
            )}

            <div className="min-w-0">
              {title && (
                <h2
                  className="
                    break-words

                    text-lg
                    font-black
                    tracking-tight
                    !text-slate-900

                    sm:text-xl
                  "
                >
                  {title}
                </h2>
              )}

              {subtitle && (
                <p
                  className="
                    mt-0.5

                    break-words

                    text-sm
                    font-semibold
                    leading-relaxed
                    !text-slate-500
                  "
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div
              className="
                flex
                shrink-0
                items-center
                gap-2
              "
            >
              {actions}
            </div>
          )}
        </div>
      )}

      {/* ===================================================
          CONTENT
      =================================================== */}

      <div
        className={`
          relative
          z-10

          w-full
          min-w-0

          ${
            padding
              ? hasHeader
                ? `
                  px-4
                  pb-4
                  pt-5

                  sm:px-5
                  sm:pb-5

                  lg:px-6
                  lg:pb-6
                `
                : `
                  p-4

                  sm:p-5
                  lg:p-6
                `
              : ""
          }

          ${contentClassName}
        `}
      >
        {children}
      </div>
    </section>
  );
}