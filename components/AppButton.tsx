import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type ButtonVariant =
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "secondary"
  | "outline"
  | "white";

type ButtonSize =
  | "sm"
  | "md"
  | "lg";

type CommonProps = {
  children: ReactNode;

  variant?: ButtonVariant;

  size?: ButtonSize;

  icon?: ReactNode;

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

type AppButtonProps =
  | LinkButtonProps
  | NormalButtonProps;

/* =========================================================
   VARIANT
========================================================= */

const variantClasses: Record<
  ButtonVariant,
  string
> = {
  primary: `
    border-blue-500/40
    bg-gradient-to-r
    from-blue-600
    to-cyan-500
    !text-white
    shadow-blue-950/20
    hover:from-blue-700
    hover:to-cyan-600
  `,

  success: `
    border-emerald-500/40
    bg-gradient-to-r
    from-emerald-600
    to-green-500
    !text-white
    shadow-emerald-950/20
    hover:from-emerald-700
    hover:to-green-600
  `,

  danger: `
    border-red-500/40
    bg-gradient-to-r
    from-red-600
    to-rose-500
    !text-white
    shadow-red-950/20
    hover:from-red-700
    hover:to-rose-600
  `,

  warning: `
    border-amber-500/40
    bg-gradient-to-r
    from-amber-500
    to-orange-500
    !text-white
    shadow-amber-950/20
    hover:from-amber-600
    hover:to-orange-600
  `,

  secondary: `
    border-slate-600
    bg-gradient-to-r
    from-slate-700
    to-slate-800
    !text-white
    shadow-slate-950/20
    hover:from-slate-800
    hover:to-slate-900
  `,

  outline: `
    border-slate-300
    bg-white/80
    !text-slate-800
    shadow-slate-900/10
    backdrop-blur-xl
    hover:border-slate-400
    hover:bg-white
  `,

  white: `
    border-white/70
    bg-white
    !text-slate-900
    shadow-slate-950/15
    hover:bg-slate-50
  `,
};

/* =========================================================
   SIZE
========================================================= */

const sizeClasses: Record<
  ButtonSize,
  string
> = {
  sm: `
    h-10
    min-w-[100px]
    px-4
    text-sm
  `,

  md: `
    h-11
    min-w-[120px]
    px-5
    text-sm
    sm:text-base
  `,

  lg: `
    h-12
    min-w-[140px]
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
    fullWidth = false,
    className = "",
  } = props;

  /* =======================================================
     BASE STYLE

     มาตรฐานปุ่มทั้งระบบ
     - ความสูงเท่ากัน
     - Radius เท่ากัน
     - Font เท่ากัน
     - Shadow เท่ากัน
     - Hover / Active แบบเดียวกัน
  ======================================================= */

  const baseClassName = `
    group
    relative
    inline-flex
    shrink-0
    select-none
    items-center
    justify-center
    gap-2
    overflow-hidden
    whitespace-nowrap
    rounded-[16px]
    border
    font-extrabold
    leading-none
    shadow-lg
    outline-none
    transition-all
    duration-200
    ease-out

    hover:-translate-y-[1px]
    hover:shadow-xl

    active:translate-y-0
    active:scale-[0.97]

    focus-visible:ring-2
    focus-visible:ring-blue-400
    focus-visible:ring-offset-2

    disabled:pointer-events-none
    disabled:cursor-not-allowed
    disabled:opacity-50
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
      {/* subtle highlight */}

      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-white/40
        "
      />

      {/* Icon */}

      {icon && (
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
            group-hover:scale-105
          "
        >
          {icon}
        </span>
      )}

      {/* Text */}

      <span
        className="
          relative
          z-10
          flex
          items-center
          justify-center
          whitespace-nowrap
        "
      >
        {children}
      </span>
    </>
  );

  /* =======================================================
     LINK
  ======================================================= */

  if ("href" in props && props.href) {
    const {
      href,
      target,
      rel,
      onClick,
    } = props;

    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        className={baseClassName}
      >
        {content}
      </Link>
    );
  }

  /* =======================================================
     BUTTON
  ======================================================= */

  const {
    type = "button",
    disabled,
    onClick,
    name,
    value,
    form,
  } = props as NormalButtonProps;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      name={name}
      value={value}
      form={form}
      className={baseClassName}
    >
      {content}
    </button>
  );
}