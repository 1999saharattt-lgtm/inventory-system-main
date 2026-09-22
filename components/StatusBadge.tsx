import type { ReactNode } from "react";

/* =========================================================
   STATUS BADGE
   iOS-Inspired Global Status Component

   ใช้สำหรับสถานะต่าง ๆ ทั้งระบบ เช่น

   - ยังใช้งาน
   - ปกติ
   - สำเร็จ
   - รอดำเนินการ
   - ใกล้หมด
   - ชำรุด
   - รอจำหน่าย
   - จำหน่ายแล้ว
   - สูญหาย
   - ตรวจไม่พบ

   IMPORTANT
   - เป็น UI Component เท่านั้น
   - ไม่แตะ Database
   - ไม่แตะ Prisma
   - ไม่แตะ API
   - ไม่แตะ Permission
   - ไม่เปลี่ยน Business Logic
========================================================= */

/* =========================================================
   TYPES
========================================================= */

export type StatusBadgeVariant =
  | "default"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "purple"
  | "neutral";

type StatusBadgeProps = {
  children: ReactNode;

  variant?: StatusBadgeVariant;

  icon?: ReactNode;

  dot?: boolean;

  className?: string;
};

/* =========================================================
   VARIANT CLASSES
========================================================= */

const variantClasses: Record<
  StatusBadgeVariant,
  string
> = {
  default: `
    border-slate-200/80
    bg-slate-100/90
    !text-slate-700
  `,

  info: `
    border-blue-200/80
    bg-blue-50/90
    !text-blue-700
  `,

  success: `
    border-emerald-200/80
    bg-emerald-50/90
    !text-emerald-700
  `,

  warning: `
    border-amber-200/80
    bg-amber-50/90
    !text-amber-700
  `,

  danger: `
    border-red-200/80
    bg-red-50/90
    !text-red-700
  `,

  purple: `
    border-violet-200/80
    bg-violet-50/90
    !text-violet-700
  `,

  neutral: `
    border-slate-300/70
    bg-white/80
    !text-slate-600
  `,
};

/* =========================================================
   DOT CLASSES
========================================================= */

const dotClasses: Record<
  StatusBadgeVariant,
  string
> = {
  default: "bg-slate-500",
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  purple: "bg-violet-500",
  neutral: "bg-slate-400",
};

/* =========================================================
   COMPONENT
========================================================= */

export default function StatusBadge({
  children,
  variant = "default",
  icon,
  dot = false,
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`
        relative
        inline-flex
        min-h-[32px]
        max-w-full
        items-center
        justify-center
        gap-1.5

        overflow-hidden

        rounded-full
        border

        px-3
        py-1

        text-sm
        font-extrabold
        leading-none

        shadow-[0_2px_8px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.7)]

        backdrop-blur-xl
        backdrop-saturate-150

        transition-all
        duration-200

        ${variantClasses[variant]}
        ${className}
      `}
    >
      {/* =====================================================
          iOS TOP HIGHLIGHT
      ===================================================== */}

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
          via-white/80
          to-transparent
        "
      />

      {/* =====================================================
          STATUS DOT
      ===================================================== */}

      {dot && (
        <span
          aria-hidden="true"
          className={`
            h-2
            w-2
            shrink-0
            rounded-full
            ${dotClasses[variant]}
          `}
        />
      )}

      {/* =====================================================
          ICON
      ===================================================== */}

      {icon !== undefined && icon !== null && (
        <span
          className="
            flex
            shrink-0
            items-center
            justify-center
          "
        >
          {icon}
        </span>
      )}

      {/* =====================================================
          TEXT
      ===================================================== */}

      <span
        className="
          min-w-0
          truncate
          whitespace-nowrap
        "
      >
        {children}
      </span>
    </span>
  );
}