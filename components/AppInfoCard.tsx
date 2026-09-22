import type {
  HTMLAttributes,
  ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type AppInfoCardProps = {
  children?: ReactNode;

  label?: ReactNode;
  value?: ReactNode;
  icon?: ReactNode;

  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  iconClassName?: string;
} & Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className"
>;

/* =========================================================
   APP INFO CARD
========================================================= */

export default function AppInfoCard({
  children,
  label,
  value,
  icon,

  className = "",
  labelClassName = "",
  valueClassName = "",
  iconClassName = "",

  ...props
}: AppInfoCardProps) {
  return (
    <div
      {...props}
      className={`
        group

        relative
        min-w-0

        overflow-hidden

        rounded-[22px]

        border
        border-white/80

        bg-gradient-to-br
        from-white/95
        via-white/90
        to-slate-50/85

        shadow-[0_18px_45px_-28px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.95)]

        ring-1
        ring-slate-900/[0.05]

        backdrop-blur-2xl

        transition-all
        duration-300

        hover:-translate-y-[1px]

        hover:border-white

        hover:shadow-[0_24px_55px_-30px_rgba(15,23,42,0.5),inset_0_1px_0_rgba(255,255,255,1)]

        ${className}
      `}
    >
      {/* =====================================================
          IOS LIGHT EFFECT
      ===================================================== */}

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

          opacity-90
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none

          absolute
          -right-10
          -top-10

          h-28
          w-28

          rounded-full

          bg-blue-400/[0.07]

          blur-3xl
        "
      />

      {/* =====================================================
          CUSTOM CONTENT MODE

          รองรับ:
          <AppInfoCard>
            ...
          </AppInfoCard>
      ===================================================== */}

      {children !== undefined ? (
        <div
          className="
            relative
            z-10
            min-w-0
          "
        >
          {children}
        </div>
      ) : (
        /* ===================================================
           STANDARD INFO MODE

           รองรับ:
           <AppInfoCard
             label="วันที่รับเข้า"
             value="..."
           />
        =================================================== */

        <div
          className="
            relative
            z-10

            flex
            min-h-[96px]
            min-w-0
            items-center
            gap-3

            px-4
            py-3.5
          "
        >
          {icon !== undefined && (
            <div
              className={`
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center

                rounded-[14px]

                border
                border-white/90

                bg-white/80

                text-xl

                shadow-[0_8px_20px_-14px_rgba(15,23,42,0.45)]

                ring-1
                ring-slate-900/[0.04]

                backdrop-blur-xl

                ${iconClassName}
              `}
            >
              {icon}
            </div>
          )}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            {label !== undefined && (
              <div
                className={`
                  text-sm
                  font-extrabold
                  !text-slate-500

                  ${labelClassName}
                `}
              >
                {label}
              </div>
            )}

            {value !== undefined && (
              <div
                className={`
                  mt-1.5

                  min-w-0

                  break-words

                  text-base
                  font-extrabold
                  leading-relaxed
                  !text-slate-900

                  sm:text-lg

                  ${valueClassName}
                `}
              >
                {value}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}