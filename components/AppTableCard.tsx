import type {
  ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type AppTableCardProps = {
  children: ReactNode;

  title?: string;
  subtitle?: string;

  icon?: ReactNode;
  actions?: ReactNode;

  count?: number;
  countLabel?: string;

  className?: string;

  minWidth?: string;

  overflowVisible?: boolean;
};

/* =========================================================
   APP TABLE CARD

   มาตรฐาน Card สำหรับ Table ทั้งระบบ
   - iOS / Glass
   - ไม่มีเส้นดำใต้หัวข้อ
   - Badge จำนวนรายการ
   - Table เลื่อนแนวนอนได้
   - Header ของ table ให้คง gradient slate ตามมาตรฐานระบบ
========================================================= */

export default function AppTableCard({
  children,

  title,
  subtitle,

  icon,
  actions,

  count,
  countLabel = "ทั้งหมด",

  className = "",

  minWidth,

  overflowVisible = false,
}: AppTableCardProps) {
  const hasHeader =
    Boolean(
      title ||
        subtitle ||
        icon ||
        actions ||
        count !== undefined
    );

  return (
    <section
      className={`
        relative

        w-full
        min-w-0

        ${
          overflowVisible
            ? "overflow-visible"
            : "overflow-hidden"
        }

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

          h-48
          w-48

          rounded-full

          bg-blue-400/[0.06]

          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -bottom-20
          -left-20

          h-48
          w-48

          rounded-full

          bg-cyan-400/[0.05]

          blur-3xl
        "
      />

      {/* ===================================================
          TABLE CARD HEADER
          ไม่มี border-bottom
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
            py-4

            sm:flex-row
            sm:items-center
            sm:justify-between

            sm:px-5
            sm:py-5

            lg:px-6
          "
        >
          {/* LEFT */}

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
                    mt-1

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

          {/* RIGHT */}

          <div
            className="
              flex
              shrink-0
              flex-wrap
              items-center
              gap-2
            "
          >
            {count !== undefined && (
              <div
                className="
                  inline-flex
                  w-fit
                  items-center
                  gap-2

                  rounded-full

                  border
                  border-slate-200

                  bg-slate-100/80

                  px-3
                  py-1.5

                  text-sm
                  font-extrabold
                  !text-slate-700

                  shadow-sm

                  ring-1
                  ring-white/70

                  backdrop-blur-xl
                "
              >
                <span>
                  {countLabel}
                </span>

                <span
                  className="
                    inline-flex
                    min-w-6
                    items-center
                    justify-center

                    rounded-full

                    bg-white

                    px-2
                    py-0.5

                    tabular-nums
                    !text-slate-900

                    shadow-sm

                    ring-1
                    ring-slate-200/70
                  "
                >
                  {count.toLocaleString(
                    "th-TH"
                  )}
                </span>
              </div>
            )}

            {actions}
          </div>
        </div>
      )}

      {/* ===================================================
          TABLE AREA
      =================================================== */}

      <div
        className={`
          relative
          z-10

          w-full
          min-w-0

          overflow-x-auto

          ${
            overflowVisible
              ? "overflow-y-visible"
              : ""
          }

          overscroll-x-contain
        `}
      >
        <div
          style={
            minWidth
              ? {
                  minWidth,
                }
              : undefined
          }
          className="
            w-full
            min-w-0
          "
        >
          {children}
        </div>
      </div>
    </section>
  );
}