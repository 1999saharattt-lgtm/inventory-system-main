import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

/* =========================================================
   APP BUTTON
   iOS-Inspired Global Button Component

   GLOBAL COLOR STANDARD

   back
   - กลับ
   - สีเขียวกรมอนามัย

   secondary
   - แก้ไข
   - สีน้ำเงิน

   danger
   - ลบ
   - สีแดง

   primary / success / warning / outline / glass / white
   - เปิด
   - เพิ่มรายการ
   - เพิ่มครุภัณฑ์
   - เพิ่มรายชื่อ
   - บันทึก
   - QR
   - รวมรายการ
   - ประวัติ
   - ตรวจสอบ
   - ปุ่มทั่วไปอื่น ๆ
   - สีน้ำตาล

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

type LinkButtonProps =
  CommonProps & {
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

type NormalButtonProps =
  CommonProps &
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
   SHARED COLOR STYLE
========================================================= */

/*
 * น้ำตาลกลางของระบบ
 *
 * ใช้กับปุ่มทั่วไปทั้งหมด
 * ยกเว้น:
 * - กลับ
 * - แก้ไข
 * - ลบ
 */

const brownButtonClass = `
  border-[#9A6848]/40

  bg-gradient-to-b
  from-[#A97855]
  via-[#8B5E3C]
  to-[#6F452C]

  !text-white

  shadow-[0_8px_20px_rgba(111,69,44,0.22),inset_0_1px_0_rgba(255,255,255,0.30)]

  hover:from-[#A97855]
  hover:via-[#87583A]
  hover:to-[#674029]

  hover:shadow-[0_12px_28px_rgba(111,69,44,0.30),inset_0_1px_0_rgba(255,255,255,0.34)]
`;

/* =========================================================
   VARIANT STYLES
========================================================= */

const variantClasses: Record<
  AppButtonVariant,
  string
> = {
  /* -------------------------------------------------------
     PRIMARY
     ปุ่มทั่วไป
     = น้ำตาล

     ตัวอย่าง:
     - เปิด
     - เพิ่มรายการ
     - เพิ่มครุภัณฑ์
     - เพิ่มรายชื่อ
     - QR
     - รวมรายการ
     - ประวัติ
     - ตรวจสอบ
  ------------------------------------------------------- */

  primary: brownButtonClass,

  /* -------------------------------------------------------
     SUCCESS
     บันทึก / ยืนยัน / เพิ่มข้อมูล
     = น้ำตาล
  ------------------------------------------------------- */

  success: brownButtonClass,

  /* -------------------------------------------------------
     WARNING
     Action อื่น ๆ
     = น้ำตาล
  ------------------------------------------------------- */

  warning: brownButtonClass,

  /* -------------------------------------------------------
     OUTLINE
     ปุ่มทั่วไป
     = น้ำตาล
  ------------------------------------------------------- */

  outline: brownButtonClass,

  /* -------------------------------------------------------
     GLASS
     ปุ่มทั่วไป
     = น้ำตาล
  ------------------------------------------------------- */

  glass: brownButtonClass,

  /* -------------------------------------------------------
     WHITE
     ปุ่มทั่วไป
     = น้ำตาล
  ------------------------------------------------------- */

  white: brownButtonClass,

  /* -------------------------------------------------------
     BACK
     ปุ่มกลับ
     = เขียวกรมอนามัย
  ------------------------------------------------------- */

  back: `
    border-emerald-400/35

    bg-gradient-to-b
    from-emerald-500
    via-emerald-600
    to-green-700

    !text-white

    shadow-[0_8px_20px_rgba(5,150,105,0.22),inset_0_1px_0_rgba(255,255,255,0.30)]

    hover:from-emerald-500
    hover:via-emerald-600
    hover:to-green-700

    hover:shadow-[0_12px_28px_rgba(5,150,105,0.30),inset_0_1px_0_rgba(255,255,255,0.34)]
  `,

  /* -------------------------------------------------------
     SECONDARY
     ปุ่มแก้ไข
     = น้ำเงินแบบเดิม
  ------------------------------------------------------- */

  secondary: `
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

    hover:shadow-[0_12px_28px_rgba(37,99,235,0.30),inset_0_1px_0_rgba(255,255,255,0.32)]
  `,

  /* -------------------------------------------------------
     DANGER
     ปุ่มลบ
     = แดง
  ------------------------------------------------------- */

  danger: `
    border-red-400/35

    bg-gradient-to-b
    from-red-500
    via-red-600
    to-rose-700

    !text-white

    shadow-[0_8px_20px_rgba(220,38,38,0.22),inset_0_1px_0_rgba(255,255,255,0.28)]

    hover:from-red-500
    hover:via-red-600
    hover:to-rose-700

    hover:shadow-[0_12px_28px_rgba(220,38,38,0.30),inset_0_1px_0_rgba(255,255,255,0.32)]
  `,
};

/* =========================================================
   SIZE

   MOBILE
   - ลด min-width ให้พอดีจอ
   - Desktop คงขนาดมาตรฐาน
========================================================= */

const sizeClasses: Record<
  AppButtonSize,
  string
> = {
  sm: `
    h-10
    min-w-[92px]

    px-3.5

    text-sm

    sm:min-w-[104px]
    sm:px-4
  `,

  md: `
    h-11
    min-w-[108px]

    px-4

    text-sm

    sm:min-w-[124px]
    sm:px-5
    sm:text-base
  `,

  lg: `
    h-12
    min-w-[124px]

    px-5

    text-base

    sm:min-w-[144px]
    sm:px-6
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

     variant="back"
     ไม่แสดง icon / endIcon
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
     FOCUS COLOR

     ให้ focus ring สอดคล้องกับสีของปุ่ม
  ======================================================= */

  const focusClassName =
    variant === "back"
      ? `
        focus-visible:ring-emerald-400/80
      `
      : variant ===
          "secondary"
        ? `
          focus-visible:ring-blue-400/80
        `
        : variant ===
            "danger"
          ? `
            focus-visible:ring-red-400/80
          `
          : `
            focus-visible:ring-[#8B5E3C]/70
          `;

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
    ${focusClassName}
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