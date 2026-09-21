import type { ReactNode } from "react";

type AppSectionProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function AppSection({
  title,
  subtitle,
  icon,
  actions,
  children,
  className = "",
  contentClassName = "",
}: AppSectionProps) {
  const hasHeader =
    title !== undefined ||
    subtitle !== undefined ||
    icon !== undefined ||
    actions !== undefined;

  return (
    <section
      className={`
        min-w-0
        overflow-hidden
        rounded-[30px]
        border
        border-white/80
        bg-white/80
        shadow-[0_22px_60px_-32px_rgba(15,23,42,0.38)]
        backdrop-blur-2xl
        ${className}
      `}
    >
      {hasHeader ? (
        <div
          className="
            flex
            flex-col
            gap-3
            border-b
            border-slate-200/80
            bg-white/40
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            {icon ? (
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-[14px]
                  border
                  border-slate-200
                  bg-white
                  text-lg
                  shadow-sm
                "
              >
                {icon}
              </div>
            ) : null}

            <div className="min-w-0">
              {title ? (
                <h2
                  className="
                    break-words
                    text-lg
                    font-black
                    leading-tight
                    !text-slate-900
                    sm:text-xl
                  "
                >
                  {title}
                </h2>
              ) : null}

              {subtitle ? (
                <p
                  className="
                    mt-1
                    break-words
                    text-sm
                    font-semibold
                    !text-slate-500
                  "
                >
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          {actions ? (
            <div className="shrink-0">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={`
          min-w-0
          p-4
          sm:p-5
          ${contentClassName}
        `}
      >
        {children}
      </div>
    </section>
  );
}
