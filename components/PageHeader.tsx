import type { ReactNode } from "react";
import BackButton from "@/components/BackButton";

/* =========================================================
   PAGE HEADER
   iOS-Inspired Global Page Header

   ใช้เป็น Header มาตรฐานของทุกหน้า

   DESIGN RULE
   - iOS-inspired
   - Glass / Layered Surface
   - Soft Lighting
   - Soft Border
   - Rounded Corner
   - Subtle Depth
   - Responsive
   - รองรับ Action Buttons
   - ใช้ BackButton มาตรฐานกลาง

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

type PageHeaderProps = {
  /**
   * ชื่อหน้าหลัก
   *
   * Example:
   * "รายการพัสดุทั้งหมด"
   */
  title: string;

  /**
   * คำอธิบายใต้ชื่อหน้า
   */
  description?: string;

  /**
   * Icon ด้านหน้าชื่อ
   *
   * รองรับ:
   * - Emoji
   * - Lucide Icon
   * - React Component
   */
  icon?: ReactNode;

  /**
   * URL สำหรับปุ่มกลับ
   *
   * ถ้าไม่กำหนด
   * จะไม่แสดงปุ่มกลับ
   */
  backHref?: string;

  /**
   * ข้อความปุ่มกลับ
   *
   * Default:
   * "กลับ"
   */
  backLabel?: string;

  /**
   * Action Buttons ด้านขวา
   *
   * Example:
   *
   * actions={
   *   <>
   *     <AppButton>เพิ่มข้อมูล</AppButton>
   *     <AppButton>PDF</AppButton>
   *   </>
   * }
   */
  actions?: ReactNode;

  /**
   * className เพิ่มเติม
   */
  className?: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function PageHeader({
  title,
  description,
  icon,
  backHref,
  backLabel = "กลับ",
  actions,
  className = "",
}: PageHeaderProps) {
  const hasActions = Boolean(
    backHref || actions
  );

  return (
    <section
      className={`
        group/header
        relative
        isolate
        w-full
        min-w-0
        overflow-hidden

        rounded-[26px]

        border
        border-white/10

        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-slate-800

        shadow-[0_16px_45px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]

        transition-[box-shadow,transform,border-color]
        duration-300
        ease-out

        hover:border-white/15
        hover:shadow-[0_20px_55px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.10)]

        ${className}
      `}
    >
      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
      >
        {/* =================================================
            BLUE LIGHT — LEFT
        ================================================= */}

        <div
          className="
            absolute
            -left-24
            -top-28

            h-72
            w-72

            rounded-full

            bg-blue-500/20

            blur-[90px]

            transition-opacity
            duration-500

            group-hover/header:opacity-90
          "
        />

        {/* =================================================
            CYAN LIGHT — RIGHT
        ================================================= */}

        <div
          className="
            absolute
            -right-24
            -top-28

            h-80
            w-80

            rounded-full

            bg-cyan-400/12

            blur-[100px]

            transition-opacity
            duration-500

            group-hover/header:opacity-90
          "
        />

        {/* =================================================
            INDIGO LIGHT — BOTTOM
        ================================================= */}

        <div
          className="
            absolute
            -bottom-32
            left-[30%]

            h-72
            w-72

            rounded-full

            bg-indigo-500/10

            blur-[100px]
          "
        />

        {/* =================================================
            GLASS OVERLAY
        ================================================= */}

        <div
          className="
            absolute
            inset-0

            bg-gradient-to-b
            from-white/[0.055]
            via-white/[0.015]
            to-transparent
          "
        />

        {/* =================================================
            TOP SPECULAR HIGHLIGHT

            เส้นสะท้อนแสงบางด้านบน
            ให้ความรู้สึกเหมือน Layer ของ iOS
        ================================================= */}

        <div
          className="
            absolute
            inset-x-6
            top-0

            h-px

            bg-gradient-to-r
            from-transparent
            via-white/40
            to-transparent
          "
        />

        {/* =================================================
            INNER LIGHT
        ================================================= */}

        <div
          className="
            absolute
            left-1/2
            top-[-70px]

            h-32
            w-[65%]

            -translate-x-1/2

            rounded-full

            bg-white/[0.045]

            blur-3xl
          "
        />
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        className="
          relative
          z-10

          flex
          min-h-[118px]
          w-full
          min-w-0

          flex-col

          justify-center

          gap-5

          px-4
          py-5

          sm:min-h-[132px]
          sm:px-6
          sm:py-6

          lg:min-h-[140px]
          lg:flex-row
          lg:items-center
          lg:justify-between
          lg:px-8
        "
      >
        {/* =================================================
            LEFT CONTENT
        ================================================= */}

        <div
          className="
            flex
            min-w-0
            flex-1

            items-center

            gap-3

            sm:gap-4
          "
        >
          {/* =================================================
              ICON
          ================================================= */}

          {icon && (
            <div
              className="
                relative
                flex

                h-12
                w-12

                shrink-0

                items-center
                justify-center

                overflow-hidden

                rounded-[16px]

                border
                border-white/15

                bg-white/[0.10]

                text-2xl
                !text-white

                shadow-[0_8px_22px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.16)]

                backdrop-blur-xl
                backdrop-saturate-150

                transition-[transform,background-color,border-color,box-shadow]
                duration-300
                ease-out

                group-hover/header:-translate-y-[1px]
                group-hover/header:border-white/20
                group-hover/header:bg-white/[0.13]
                group-hover/header:shadow-[0_12px_28px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.20)]

                sm:h-14
                sm:w-14
                sm:rounded-[18px]
                sm:text-3xl
              "
            >
              {/* Top Highlight */}

              <span
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  inset-x-2
                  top-0
                  h-px

                  bg-gradient-to-r
                  from-transparent
                  via-white/50
                  to-transparent
                "
              />

              {/* Icon Content */}

              <span
                className="
                  relative
                  z-10

                  flex
                  items-center
                  justify-center
                "
              >
                {icon}
              </span>
            </div>
          )}

          {/* =================================================
              TITLE / DESCRIPTION
          ================================================= */}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <h1
              className="
                break-words

                text-2xl
                font-extrabold

                leading-[1.15]

                tracking-tight

                !text-white

                sm:text-3xl
              "
            >
              {title}
            </h1>

            {description && (
              <p
                className="
                  mt-2

                  max-w-3xl

                  break-words

                  text-sm
                  font-bold

                  leading-relaxed

                  !text-slate-300

                  sm:text-base
                "
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* =================================================
            RIGHT ACTION AREA
        ================================================= */}

        {hasActions && (
          <div
            className="
              flex

              w-full
              shrink-0

              flex-col

              gap-2.5

              sm:flex-row
              sm:flex-wrap
              sm:items-center

              lg:w-auto
              lg:justify-end
            "
          >
            {/* =================================================
                CUSTOM ACTIONS

                ปุ่มทั้งหมดใน actions
                ควรใช้ AppButton
            ================================================= */}

            {actions && (
              <div
                className="
                  flex

                  w-full

                  flex-col

                  gap-2.5

                  sm:w-auto
                  sm:flex-row
                  sm:flex-wrap
                  sm:items-center
                "
              >
                {actions}
              </div>
            )}

            {/* =================================================
                BACK BUTTON
            ================================================= */}

            {backHref && (
              <BackButton
                href={backHref}
                label={backLabel}
                size="md"
                className="
                  w-full
                  sm:w-auto
                "
              />
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          BOTTOM EDGE LIGHT
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-8
          bottom-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white/[0.08]
          to-transparent
        "
      />
    </section>
  );
}