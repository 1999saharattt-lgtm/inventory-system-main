import type { ReactNode } from "react";

/* =========================================================
   SURFACE CARD
   iOS-Inspired Global Surface Component

   ใช้เป็นมาตรฐาน Card / Panel / Section ทั้งระบบ

   DESIGN RULE
   - iOS-inspired
   - Layered Surface
   - Soft Glass
   - Soft Border
   - Rounded Corner
   - Subtle Highlight
   - Soft Shadow
   - Smooth Interaction
   - Responsive

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

export type SurfaceCardVariant =
  | "light"
  | "dark"
  | "glass";

export type SurfaceCardPadding =
  | "none"
  | "sm"
  | "md"
  | "lg";

type SurfaceCardProps = {
  /**
   * เนื้อหาภายใน Card
   */
  children: ReactNode;

  /**
   * รูปแบบพื้นผิว
   *
   * light
   * - Card สีขาว
   * - ใช้กับข้อมูลทั่วไป
   *
   * dark
   * - Card สีเข้ม
   * - ใช้กับ Dashboard / Summary
   *
   * glass
   * - Card โปร่งใสแบบ Glass
   */
  variant?: SurfaceCardVariant;

  /**
   * Padding ภายใน Card
   */
  padding?: SurfaceCardPadding;

  /**
   * เปิด Hover Interaction
   *
   * Default = false
   */
  interactive?: boolean;

  /**
   * className เพิ่มเติม
   */
  className?: string;
};

/* =========================================================
   VARIANT
========================================================= */

const variantClasses: Record<
  SurfaceCardVariant,
  string
> = {
  /* -------------------------------------------------------
     LIGHT

     ใช้เป็น Card หลักของหน้าทั่วไป
  ------------------------------------------------------- */

  light: `
    border-slate-200/80

    bg-white/80

    text-slate-900

    shadow-[0_10px_35px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.95)]

    backdrop-blur-xl
    backdrop-saturate-150
  `,

  /* -------------------------------------------------------
     DARK

     ใช้กับ Dashboard / Summary / Section สีเข้ม
  ------------------------------------------------------- */

  dark: `
    border-white/10

    bg-gradient-to-br
    from-slate-950
    via-slate-900
    to-slate-800

    text-white

    shadow-[0_14px_40px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]
  `,

  /* -------------------------------------------------------
     GLASS

     ใช้บนพื้นหลังที่มี Layer อยู่แล้ว
  ------------------------------------------------------- */

  glass: `
    border-white/20

    bg-white/10

    text-white

    shadow-[0_10px_30px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.16)]

    backdrop-blur-2xl
    backdrop-saturate-150
  `,
};

/* =========================================================
   PADDING
========================================================= */

const paddingClasses: Record<
  SurfaceCardPadding,
  string
> = {
  none: "",

  sm: `
    p-3
    sm:p-4
  `,

  md: `
    p-4
    sm:p-5
    lg:p-6
  `,

  lg: `
    p-5
    sm:p-6
    lg:p-8
  `,
};

/* =========================================================
   COMPONENT
========================================================= */

export default function SurfaceCard({
  children,
  variant = "light",
  padding = "md",
  interactive = false,
  className = "",
}: SurfaceCardProps) {
  return (
    <section
      className={`
        group/surface
        relative
        isolate

        w-full
        min-w-0

        overflow-hidden

        rounded-[24px]

        border

        ${variantClasses[variant]}

        ${paddingClasses[padding]}

        ${
          interactive
            ? `
              cursor-default

              transition-[transform,box-shadow,border-color]
              duration-300
              ease-out

              hover:-translate-y-[2px]

              hover:shadow-[0_18px_45px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.14)]
            `
            : ""
        }

        ${className}
      `}
    >
      {/* =====================================================
          TOP SPECULAR HIGHLIGHT

          แสงสะท้อนบางด้านบน
          เป็นภาษาภาพเดียวกับ AppButton / PageHeader
      ===================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          inset-x-5
          top-0
          z-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white/35
          to-transparent

          opacity-80
        "
      />

      {/* =====================================================
          SOFT LIGHT — TOP LEFT
      ===================================================== */}

      <span
        aria-hidden="true"
        className={`
          pointer-events-none

          absolute
          -left-20
          -top-24
          z-0

          h-56
          w-56

          rounded-full

          blur-[80px]

          ${
            variant === "light"
              ? "bg-blue-400/[0.08]"
              : "bg-blue-500/[0.10]"
          }
        `}
      />

      {/* =====================================================
          SOFT LIGHT — RIGHT
      ===================================================== */}

      <span
        aria-hidden="true"
        className={`
          pointer-events-none

          absolute
          -right-20
          -top-20
          z-0

          h-52
          w-52

          rounded-full

          blur-[80px]

          ${
            variant === "light"
              ? "bg-cyan-300/[0.06]"
              : "bg-cyan-400/[0.07]"
          }
        `}
      />

      {/* =====================================================
          GLASS OVERLAY
      ===================================================== */}

      <span
        aria-hidden="true"
        className={`
          pointer-events-none

          absolute
          inset-0
          z-0

          ${
            variant === "light"
              ? `
                bg-gradient-to-b
                from-white/30
                via-transparent
                to-transparent
              `
              : `
                bg-gradient-to-b
                from-white/[0.035]
                via-transparent
                to-transparent
              `
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
          min-w-0
        "
      >
        {children}
      </div>
    </section>
  );
}