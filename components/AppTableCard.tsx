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
   * รองรับทั้ง API ใหม่และโค้ดเดิม
   *
   * badge="15 รายการ"
   * count={15}
   */
  badge?: ReactNode;
  count?: number;

  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  badgeClassName?: string;
} & Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "title"
>;

/* =========================================================
   CLASSNAME HELPER
========================================================= */

function cn(
  ...classes: Array<
    string | undefined | null | false
  >
) {
  return classes
    .filter(Boolean)
    .join(" ");
}

/* =========================================================
   COMPONENT
========================================================= */

export default function AppTableCard({
  children,

  title,
  subtitle,

  badge,
  count,

  className,
  headerClassName,
  contentClassName,
  badgeClassName,

  ...props
}: AppTableCardProps) {
  /* =========================================================
     BADGE VALUE

     ถ้ามี badge ให้ใช้ badge
     ถ้าไม่มี badge แต่มี count ให้แสดงจำนวนรายการ
  ========================================================= */

  const badgeContent =
    badge !== undefined &&
    badge !== null
      ? badge
      : count !== undefined
        ? `${count.toLocaleString(
            "th-TH"
          )} รายการ`
        : null;

  const hasHeader =
    Boolean(title) ||
    Boolean(subtitle) ||
    badgeContent !== null;

  return (
    <section
      {...props}
      className={cn(
        `
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
        `,
        className
      )}
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

          bg-cyan-400/[0.07]

          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0

          h-28
          w-80

          -translate-x-1/2

          rounded-full

          bg-white/50

          blur-3xl
        "
      />

      {/* =====================================================
          HEADER
      ===================================================== */}

      {hasHeader && (
        <div
          className={cn(
            `
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
            `,
            headerClassName
          )}
        >
          {/* =================================================
              TITLE + SUBTITLE
          ================================================= */}

          <div className="min-w-0">
            {title && (
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

            {subtitle && (
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
              BADGE / COUNT
          ================================================= */}

          {badgeContent !== null && (
            <div
              className={cn(
                `
                  inline-flex
                  w-fit
                  shrink-0
                  items-center
                  justify-center
                  gap-2

                  rounded-full

                  border
                  border-slate-200/90

                  bg-slate-100/80

                  px-3
                  py-1.5

                  text-sm
                  font-extrabold
                  !text-slate-700

                  shadow-sm

                  ring-1
                  ring-black/[0.02]

                  backdrop-blur-xl
                `,
                badgeClassName
              )}
            >
              {badgeContent}
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        className={cn(
          `
            relative
            z-10

            w-full
            min-w-0
          `,
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}