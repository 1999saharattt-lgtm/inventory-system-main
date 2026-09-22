import type { ReactNode } from "react";

/* =========================================================
   EMPTY STATE
   iOS-Inspired Global Empty State

   ใช้สำหรับกรณีไม่มีข้อมูล เช่น

   - ไม่มีรายการพัสดุ
   - ไม่มีรายการรับเข้า
   - ไม่มีรายการเบิกจ่าย
   - ไม่มีประวัติการตรวจสอบ
   - ไม่มีผู้จำหน่าย
   - ไม่พบผลการค้นหา

   DESIGN
   - iOS-inspired
   - Soft Glass Surface
   - Rounded Corners
   - Specular Highlight
   - Responsive
   - รองรับ Action Button

   IMPORTANT
   - UI Component เท่านั้น
   - ไม่แตะ Database
   - ไม่แตะ Prisma
   - ไม่แตะ API
   - ไม่แตะ Route
   - ไม่เปลี่ยน Permission
   - ไม่เปลี่ยน Business Logic
========================================================= */

/* =========================================================
   TYPES
========================================================= */

type EmptyStateProps = {
  /**
   * หัวข้อหลัก
   */
  title?: ReactNode;

  /**
   * รายละเอียดเพิ่มเติม
   */
  description?: ReactNode;

  /**
   * Icon / Emoji / Lucide Icon
   */
  icon?: ReactNode;

  /**
   * ปุ่มหรือ Action ด้านล่าง
   *
   * แนะนำให้ใช้ AppButton
   */
  action?: ReactNode;

  /**
   * className เพิ่มเติม
   */
  className?: string;

  /**
   * ขนาด
   */
  size?: "sm" | "md" | "lg";
};

/* =========================================================
   SIZE
========================================================= */

const sizeClasses = {
  sm: {
    container: "px-4 py-8 sm:px-6 sm:py-10",
    icon: "h-14 w-14 rounded-[18px] text-2xl",
    title: "text-lg sm:text-xl",
    description: "text-sm sm:text-base",
  },

  md: {
    container: "px-5 py-10 sm:px-8 sm:py-14",
    icon: "h-16 w-16 rounded-[20px] text-3xl",
    title: "text-xl sm:text-2xl",
    description: "text-sm sm:text-base",
  },

  lg: {
    container: "px-6 py-12 sm:px-10 sm:py-16",
    icon: "h-20 w-20 rounded-[24px] text-4xl",
    title: "text-2xl sm:text-3xl",
    description: "text-base sm:text-lg",
  },
};

/* =========================================================
   COMPONENT
========================================================= */

export default function EmptyState({
  title = "ไม่พบข้อมูล",
  description,
  icon = "📭",
  action,
  className = "",
  size = "md",
}: EmptyStateProps) {
  const currentSize = sizeClasses[size];

  return (
    <div
      className={`
        relative
        isolate

        w-full
        min-w-0

        overflow-hidden

        rounded-[24px]

        border
        border-slate-200/80

        bg-gradient-to-b
        from-white/95
        via-white/90
        to-slate-50/90

        shadow-[0_10px_35px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)]

        backdrop-blur-2xl
        backdrop-saturate-150

        ${currentSize.container}
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
          inset-x-8
          top-0
          z-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white
          to-transparent
        "
      />

      {/* =====================================================
          BACKGROUND GLOW
      ===================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          left-1/2
          top-1/2
          z-0

          h-48
          w-48

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-blue-400/[0.06]

          blur-[70px]
        "
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div
        className="
          relative
          z-10

          mx-auto

          flex
          max-w-xl
          flex-col

          items-center
          justify-center

          text-center
        "
      >
        {/* =================================================
            ICON
        ================================================= */}

        <div
          className={`
            relative

            flex
            shrink-0

            items-center
            justify-center

            overflow-hidden

            border
            border-slate-200/80

            bg-gradient-to-b
            from-white
            to-slate-100/90

            text-slate-700

            shadow-[0_8px_24px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,1)]

            ${currentSize.icon}
          `}
        >
          {/* Icon Highlight */}

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
              via-white
              to-transparent
            "
          />

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

        {/* =================================================
            TITLE
        ================================================= */}

        <h3
          className={`
            mt-5

            break-words

            font-extrabold
            leading-tight

            !text-slate-900

            ${currentSize.title}
          `}
        >
          {title}
        </h3>

        {/* =================================================
            DESCRIPTION
        ================================================= */}

        {description !== undefined &&
          description !== null && (
            <p
              className={`
                mt-2

                max-w-lg

                break-words

                font-semibold
                leading-relaxed

                !text-slate-500

                ${currentSize.description}
              `}
            >
              {description}
            </p>
          )}

        {/* =================================================
            ACTION
        ================================================= */}

        {action !== undefined && action !== null && (
          <div
            className="
              mt-6

              flex
              w-full

              items-center
              justify-center
            "
          >
            {action}
          </div>
        )}
      </div>
    </div>
  );
}