import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

/* =========================================================
   APP BUTTON
   iOS-Inspired Global Button Component

   ใช้เป็นมาตรฐานปุ่มทั้งระบบ

   DESIGN RULE
   - iOS-inspired
   - Soft Glass Surface
   - Soft Highlight
   - Layered Shadow
   - Rounded Corners
   - Smooth Hover
   - Physical Press Feedback
   - Focus Ring
   - ขนาดมาตรฐานเดียวกัน

   IMPORTANT
   - ไม่เกี่ยวข้องกับ Database
   - ไม่เกี่ยวข้องกับ Prisma
   - ไม่เปลี่ยน Route
   - ไม่เปลี่ยน Permission
   - ไม่เปลี่ยน Business Logic

   BACK BUTTON RULE
   - variant="back" จะแสดงเฉพาะข้อความ
   - ไม่แสดง icon ด้านหน้า
   - ไม่แสดง endIcon ด้านหลัง
   - ทำให้ปุ่ม "กลับ" ทั้งระบบเป็นมาตรฐานเดียวกัน
========================================================= */

/* =========================================================
   TYPES
========================================================= */

export type AppButtonVariant =
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "secondary"
  | "outline"
  | "glass"
  | "white"
  | "back";

export type AppButtonSize =
  | "sm"
  | "md"
  | "lg";

type CommonProps = {
  children: ReactNode;

  variant?: AppButtonVariant;

  size?: AppButtonSize;

  icon?: ReactNode;

  endIcon?: ReactNode;

  fullWidth?: boolean;

  className?: string;
};

/* =========================================================
   LINK BUTTON
========================================================= */

type LinkButtonProps = CommonProps & {
  href: string;

  target?: string;

  rel?: string;

  onClick?: () => void;

  type?: never;

  disabled?: never;
};

/* =========================================================
   NORMAL BUTTON
========================================================= */

type NormalButtonProps = CommonProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  > & {
    href?: never;
  };

export type AppButtonProps =
  | LinkButtonProps
  | NormalButtonProps;

/* =========================================================
   VARIANT STYLES

   ใช้สีตามหน้าที่ของปุ่ม
   แต่คงภาษาการออกแบบแบบ iOS เหมือนกันทั้งหมด
========================================================= */

const variantClasses: Record<
  AppButtonVariant,
  string
> = {
  /* -------------------------------------------------------
     PRIMARY
     ปุ่มหลักของระบบ
  ------------------------------------------------------- */

  primary: `
    border-blue-400/35
    bg-gradient-to-b
    from-blue-500
    via-blue-600
    to-blue-700
    !text-white

    shadow-[0_8px_20px_rgba(37,99,235,0.22),inset_0_1px_0_rgba(255,255,255,0.28)]

    hover:from-blue-500
    hover:via-blue-600
    hover:to-blue-700
    hover:shadow-[0_12px_28px_rgba(37,99,235,0.28),inset_0_1px_0_rgba(255,255,255,0.32)]
  `,

  /* -------------------------------------------------------
     SUCCESS
     บันทึก / ยืนยันเชิงบวก
  ------------------------------------------------------- */

  success: `
    border-emerald-400/35
    bg-gradient-to-b
    from-emerald-500
    via-emerald-600
    to-emerald-700
    !text-white

    shadow-[0_8px_20px_rgba(5,150,105,0.20),inset_0_1px_0_rgba(255,255,255,0.28)]

    hover:from-emerald-500
    hover:via-emerald-600
    hover:to-emerald-700
    hover:shadow-[0_12px_28px_rgba(5,150,105,0.26),inset_0_1px_0_rgba(255,255,255,0.32)]
  `,

  /* -------------------------------------------------------
     BACK
     ปุ่มกลับมาตรฐานของระบบ

     หมายเหตุ:
     icon / endIcon จะถูกซ่อนใน component
     เมื่อ variant === "back"
  ------------------------------------------------------- */

  back: `
    border-emerald-400/35
    bg-gradient-to-b
    from-emerald-500
    via-emerald-600
    to-emerald-700
    !text-white

    shadow-[0_8px_20px_rgba(5,150,105,0.20),inset_0_1px_0_rgba(255,255,255,0.28)]

    hover:from-emerald-500
    hover:via-emerald-600
    hover:to-emerald-700
    hover:shadow-[0_12px_28px_rgba(5,150,105,0.26),inset_0_1px_0_rgba(255,255,255,0.32)]
  `,

  /* -------------------------------------------------------
     DANGER
     ลบ / จำหน่าย / PDF / การกระทำอันตราย
  ------------------------------------------------------- */

  danger: `
    border-red-400/35
    bg-gradient-to-b
    from-red-500
    via-red-600
    to-rose-700
    !text-white

    shadow-[0_8px_20px_rgba(220,38,38,0.20),inset_0_1px_0_rgba(255,255,255,0.28)]

    hover:from-red-500
    hover:via-red-600
    hover:to-rose-700
    hover:shadow-[0_12px_28px_rgba(220,38,38,0.26),inset_0_1px_0_rgba(255,255,255,0.32)]
  `,

  /* -------------------------------------------------------
     WARNING
  ------------------------------------------------------- */

  warning: `
    border-amber-300/40
    bg-gradient-to-b
    from-amber-400
    via-amber-500
    to-orange-600
    !text-white

    shadow-[0_8px_20px_rgba(245,158,11,0.20),inset_0_1px_0_rgba(255,255,255,0.30)]

    hover:from-amber-400
    hover:via-amber-500
    hover:to-orange-600
    hover:shadow-[0_12px_28px_rgba(245,158,11,0.26),inset_0_1px_0_rgba(255,255,255,0.34)]
  `,

  /* -------------------------------------------------------
     SECONDARY
     ยกเลิก / Action รอง
  ------------------------------------------------------- */

  secondary: `
    border-slate-500/40
    bg-gradient-to-b
    from-slate-600
    via-slate-700
    to-slate-800
    !text-white

    shadow-[0_8px_20px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.18)]

    hover:from-slate-600
    hover:via-slate-700
    hover:to-slate-800
    hover:shadow-[0_12px_28px_rgba(15,23,42,0.24),inset_0_1px_0_rgba(255,255,255,0.22)]
  `,

  /* -------------------------------------------------------
     OUTLINE
  ------------------------------------------------------- */

  outline: `
    border-slate-300/80
    bg-white/75
    !text-slate-800

    shadow-[0_6px_18px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]

    backdrop-blur-xl
    backdrop-saturate-150

    hover:border-slate-300
    hover:bg-white/90
    hover:shadow-[0_10px_24px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,1)]
  `,

  /* -------------------------------------------------------
     GLASS
     ใช้บน Header / พื้นหลังเข้ม
  ------------------------------------------------------- */

  glass: `
    border-white/20
    bg-white/10
    !text-white

    shadow-[0_8px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.18)]

    backdrop-blur-xl
    backdrop-saturate-150

    hover:border-white/30
    hover:bg-white/15
    hover:shadow-[0_12px_30px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.24)]
  `,

  /* -------------------------------------------------------
     WHITE
  ------------------------------------------------------- */

  white: `
    border-white/90
    bg-gradient-to-b
    from-white
    to-slate-50
    !text-slate-900

    shadow-[0_8px_22px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,1)]

    hover:from-white
    hover:to-white
    hover:shadow-[0_12px_28px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,1)]
  `,
};

/* =========================================================
   SIZE

   ความสูงของปุ่มถูกกำหนดจากส่วนกลาง
   เพื่อให้ทุกหน้ามีขนาดตรงกัน
========================================================= */

const sizeClasses: Record<
  AppButtonSize,
  string
> = {
  sm: `
    h-10
    min-w-[104px]
    px-4
    text-sm
  `,

  md: `
    h-11
    min-w-[124px]
    px-5
    text-sm
    sm:text-base
  `,

  lg: `
    h-12
    min-w-[144px]
    px-6
    text-base
    sm:text-lg
  `,
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AppButton(
  props: AppButtonProps
) {
  const {
    children,
    variant = "primary",
    size = "md",
    icon,
    endIcon,
    fullWidth = false,
    className = "",
  } = props;

  /* =======================================================
     BACK BUTTON

     ปุ่ม variant="back" ต้องแสดงเฉพาะข้อความ
     แม้ว่าหน้าเดิมจะยังส่ง icon="←" เข้ามา
     AppButton จะไม่ render icon นั้น

     ผล:
     จาก  ← กลับ
     เป็น  กลับ
  ======================================================= */

  const isBackButton =
    variant === "back";

  const visibleIcon =
    isBackButton
      ? null
      : icon;

  const visibleEndIcon =
    isBackButton
      ? null
      : endIcon;

  /* =======================================================
     BASE STYLE
  ======================================================= */

  const baseClassName = `
    group
    relative
    isolate
    inline-flex
    shrink-0
    select-none
    items-center
    justify-center
    gap-2
    overflow-hidden
    whitespace-nowrap

    rounded-[14px]
    border

    font-extrabold
    leading-none

    outline-none

    transition-[transform,box-shadow,background-color,border-color,opacity]
    duration-200
    ease-out

    will-change-transform

    hover:-translate-y-[1px]

    active:translate-y-[1px]
    active:scale-[0.97]

    focus-visible:ring-2
    focus-visible:ring-blue-400/80
    focus-visible:ring-offset-2
    focus-visible:ring-offset-white

    disabled:pointer-events-none
    disabled:cursor-not-allowed
    disabled:opacity-45
    disabled:shadow-none

    ${variantClasses[variant]}

    ${sizeClasses[size]}

    ${
      fullWidth
        ? "w-full"
        : "w-auto"
    }

    ${className}
  `;

  /* =======================================================
     CONTENT
  ======================================================= */

  const content = (
    <>
      {/* ===================================================
          TOP HIGHLIGHT
      =================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-2
          top-0
          z-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/60
          to-transparent
          opacity-80
        "
      />

      {/* ===================================================
          SOFT GLASS GLOW
      =================================================== */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -top-8
          left-1/2
          z-0
          h-14
          w-[80%]
          -translate-x-1/2
          rounded-full
          bg-white/10
          blur-xl
          transition-opacity
          duration-200
          group-hover:opacity-100
        "
      />

      {/* ===================================================
          START ICON

          variant="back" จะไม่แสดงส่วนนี้
      =================================================== */}

      {visibleIcon && (
        <span
          className="
            relative
            z-10
            flex
            shrink-0
            items-center
            justify-center

            transition-transform
            duration-200
            ease-out

            group-hover:scale-[1.04]
            group-active:scale-95
          "
        >
          {visibleIcon}
        </span>
      )}

      {/* ===================================================
          LABEL
      =================================================== */}

      <span
        className="
          relative
          z-10
          flex
          min-w-0
          items-center
          justify-center
          whitespace-nowrap
        "
      >
        {children}
      </span>

      {/* ===================================================
          END ICON

          variant="back" จะไม่แสดงส่วนนี้
      =================================================== */}

      {visibleEndIcon && (
        <span
          className="
            relative
            z-10
            flex
            shrink-0
            items-center
            justify-center

            transition-transform
            duration-200
            ease-out

            group-hover:translate-x-[1px]
            group-active:translate-x-0
          "
        >
          {visibleEndIcon}
        </span>
      )}
    </>
  );

  /* =======================================================
     LINK BUTTON
  ======================================================= */

  if (
    "href" in props &&
    props.href
  ) {
    const {
      href,
      target,
      rel,
      onClick,
    } = props;

    const safeRel =
      target === "_blank"
        ? rel ??
          "noopener noreferrer"
        : rel;

    return (
      <Link
        href={href}
        target={target}
        rel={safeRel}
        onClick={onClick}
        className={
          baseClassName
        }
      >
        {content}
      </Link>
    );
  }

  /* =======================================================
     NORMAL BUTTON
  ======================================================= */

  const {
    type = "button",
    disabled,
    onClick,
    name,
    value,
    form,
    id,
    title,
    "aria-label":
      ariaLabel,
  } =
    props as NormalButtonProps;

  return (
    <button
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      name={name}
      value={value}
      form={form}
      title={title}
      aria-label={
        ariaLabel
      }
      className={
        baseClassName
      }
    >
      {content}
    </button>
  );
}