import type { ReactNode } from "react";

/* =========================================================
   SECTION HEADER
   iOS-Inspired Global Section Header

   ใช้เป็นมาตรฐานหัวข้อภายใน Card / Panel / Section ทั้งระบบ

   DESIGN RULE
   - iOS-inspired
   - Soft Glass
   - Rounded Corners
   - Layered Surface
   - Specular Highlight
   - Responsive
   - รองรับ Light / Dark
   - ใช้ร่วมกับ SurfaceCard

   IMPORTANT
   - ไม่เกี่ยวข้องกับ Database
   - ไม่เกี่ยวข้องกับ Prisma
   - ไม่เปลี่ยน Route
   - ไม่เปลี่ยน Permission
   - ไม่เปลี่ยน Business Logic
========================================================= */

/* =========================================================
   TYPES
========================================================= */

export type SectionHeaderVariant =
  | "light"
  | "dark"
  | "glass";

type SectionHeaderProps = {
  /**
   * หัวข้อหลัก
   */
  title: ReactNode;

  /**
   * คำอธิบายใต้หัวข้อ
   */
  description?: ReactNode;

  /**
   * Icon ด้านซ้าย
   *
   * รองรับ Emoji / Lucide Icon / ReactNode
   */
  icon?: ReactNode;

  /**
   * เนื้อหาด้านขวา
   *
   * เช่น Badge / Button / Counter
   */
  action?: ReactNode;

  /**
   * รูปแบบสี
   */
  variant?: SectionHeaderVariant;

  /**
   * className เพิ่มเติม
   */
  className?: string;
};

/* =========================================================
   VARIANT
========================================================= */

const variantClasses: Record<
  SectionHeaderVariant,
  string
> = {
  /* -------------------------------------------------------
     LIGHT
  ------------------------------------------------------- */

  light: `
    border-slate-200/80

    bg-gradient-to-b
    from-white/95
    to-slate-50/85

    text-slate-900

    shadow-[0_8px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]

    backdrop-blur-xl
    backdrop-saturate-150
  `,

  /* -------------------------------------------------------
     DARK
  ------------------------------------------------------- */

  dark: `
    border-white/10

    bg-gradient-to-r
    from-slate-800/95
    via-slate-800/90
    to-slate-700/90

    text-white

    shadow-[0_8px_26px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.08)]

    backdrop-blur-xl
    backdrop-saturate-150
  `,

  /* -------------------------------------------------------
     GLASS
  ------------------------------------------------------- */

  glass: `
    border-white/15

    bg-white/[0.08]

    text-white

    shadow-[0_8px_24px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.12)]

    backdrop-blur-2xl
    backdrop-saturate-150
  `,
};

/* =========================================================
   COMPONENT
========================================================= */

export default function SectionHeader({
  title,
  description,
  icon,
  action,
  variant = "dark",
  className = "",
}: SectionHeaderProps) {
  const isLight = variant === "light";

  return (
    <div
      className={`
        relative
        isolate

        w-full
        min-w-0

        overflow-hidden

        rounded-[18px]

        border

        px-4
        py-3

        sm:px-5
        sm:py-3.5

        ${variantClasses[variant]}

        ${className}
      `}
    >
      {/* =====================================================
          TOP SPECULAR HIGHLIGHT
      ===================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          inset-x-4
          top-0
          z-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white/40
          to-transparent
        "
      />

      {/* =====================================================
          SOFT LIGHT
      ===================================================== */}

      <span
        aria-hidden="true"
        className={`
          pointer-events-none

          absolute
          -left-12
          -top-16
          z-0

          h-32
          w-32

          rounded-full

          blur-[55px]

          ${
            isLight
              ? "bg-blue-400/[0.08]"
              : "bg-blue-400/[0.10]"
          }
        `}
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        className="
          relative
          z-10

          flex
          min-w-0

          items-center
          justify-between

          gap-3
        "
      >
        {/* =================================================
            LEFT
        ================================================= */}

        <div
          className="
            flex
            min-w-0
            flex-1
            items-center
            gap-3
          "
        >
          {/* ===============================================
              ICON
          =============================================== */}

          {icon !== undefined && icon !== null && (
            <div
              className={`
                flex
                h-10
                w-10
                shrink-0

                items-center
                justify-center

                rounded-[13px]

                border

                text-lg

                shadow-sm

                ${
                  isLight
                    ? `
                      border-slate-200/80
                      bg-white/80
                      text-slate-700
                    `
                    : `
                      border-white/10
                      bg-white/10
                      text-white
                    `
                }
              `}
            >
              {icon}
            </div>
          )}

          {/* ===============================================
              TITLE + DESCRIPTION
          =============================================== */}

          <div className="min-w-0 flex-1">
            <h2
              className={`
                break-words

                text-lg
                font-extrabold
                leading-tight

                sm:text-xl

                ${
                  isLight
                    ? "!text-slate-900"
                    : "!text-white"
                }
              `}
            >
              {title}
            </h2>

            {description !== undefined &&
              description !== null && (
                <p
                  className={`
                    mt-1

                    break-words

                    text-sm
                    font-semibold
                    leading-snug

                    sm:text-base

                    ${
                      isLight
                        ? "!text-slate-500"
                        : "!text-slate-300"
                    }
                  `}
                >
                  {description}
                </p>
              )}
          </div>
        </div>

        {/* =================================================
            ACTION
        ================================================= */}

        {action !== undefined && action !== null && (
          <div
            className="
              flex
              shrink-0
              items-center
              justify-end
            "
          >
            {action}
          </div>
        )}
      </div>
    </div>
  );
}