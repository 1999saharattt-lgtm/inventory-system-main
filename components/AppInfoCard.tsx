import type {
  HTMLAttributes,
  ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

export type AppTableCardProps = {
  children: ReactNode;

  title?: ReactNode;
  subtitle?: ReactNode;

  /*
   * รองรับข้อความด้านขวาของหัวตาราง เช่น
   * badge="15 รายการ"
   */
  badge?: ReactNode;

  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  badgeClassName?: string;
} & Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "className" | "title"
>;

/* =========================================================
   APP TABLE CARD
========================================================= */

export default function AppTableCard({
  children,

  title,
  subtitle,
  badge,

  className = "",
  headerClassName = "",
  contentClassName = "",
  badgeClassName = "",

  ...props
}: AppTableCardProps) {
  const hasHeader =
    title !== undefined ||
    subtitle !== undefined ||
    badge !== undefined;

  return (
    <section
      {...props}
      className={`
        relative
        w-full
        min-w-0

        overflow-hidden

        rounded-[28px]

        border
        border-white/80

        bg-gradient-to-br
        from-white/95
        via-white/90
        to-slate-50/85

        shadow-[0_24px_70px_-36px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.95)]

        ring-1
        ring-slate-900/[0.05]

        backdrop-blur-2xl

        ${className}
      `}
    >
      {/* =====================================================
          IOS AMBIENT BACKGROUND
      ===================================================== */}

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

          h-52
          w-52

          rounded-full

          bg-cyan-400/[0.06]

          blur-3xl
        "
      />

      {/* แสงสะท้อนด้านบนแบบ iOS */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white
          to-transparent
        "
      />

      {/* =====================================================
          HEADER
      ===================================================== */}

      {hasHeader && (
        <div
          className={`
            relative
            z-10

            flex
            flex-col
            gap-3

            px-5
            py-5

            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:px-6

            ${headerClassName}
          `}
        >
          {/* =================================================
              TITLE + SUBTITLE
          ================================================= */}

          <div className="min-w-0">
            {title !== undefined && (
              <h2
                className="
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

            {subtitle !== undefined && (
              <p
                className="
                  mt-1

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

          {/* =================================================
              BADGE
          ================================================= */}

          {badge !== undefined && (
            <div
              className={`
                inline-flex
                w-fit
                shrink-0
                items-center
                justify-center
                gap-2

                rounded-full

                border
                border-white/90

                bg-white/80

                px-3.5
                py-1.5

                text-sm
                font-extrabold
                !text-slate-700

                shadow-[0_8px_22px_-14px_rgba(15,23,42,0.45)]

                ring-1
                ring-slate-900/[0.05]

                backdrop-blur-xl

                ${badgeClassName}
              `}
            >
              {badge}
            </div>
          )}
        </div>
      )}

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
        {children}
      </div>
    </section>
  );
}