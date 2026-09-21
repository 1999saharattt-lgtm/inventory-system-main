import type { ReactNode } from "react";
import BackButton from "@/components/BackButton";

type AppPageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
};

export default function AppPageHeader({
  title,
  subtitle,
  icon,
  backHref,
  backLabel,
  actions,
  className = "",
}: AppPageHeaderProps) {
  return (
    <section
      className={`
        relative
        overflow-hidden
        rounded-[30px]
        border
        border-white/80
        bg-white/80
        px-5
        py-5
        shadow-[0_22px_60px_-32px_rgba(15,23,42,0.38)]
        backdrop-blur-2xl
        sm:px-6
        sm:py-6
        ${className}
      `}
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-36
          w-36
          rounded-full
          bg-blue-300/15
          blur-2xl
        "
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {icon ? (
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-[17px]
                border
                border-slate-200/80
                bg-white/90
                text-xl
                shadow-sm
                sm:h-14
                sm:w-14
                sm:text-2xl
              "
            >
              {icon}
            </div>
          ) : null}

          <div className="min-w-0">
            <h1
              className="
                break-words
                text-2xl
                font-black
                leading-tight
                tracking-tight
                !text-slate-900
                sm:text-3xl
              "
            >
              {title}
            </h1>

            {subtitle ? (
              <p
                className="
                  mt-1.5
                  break-words
                  text-sm
                  font-semibold
                  leading-relaxed
                  !text-slate-500
                  sm:text-base
                "
              >
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>

        {(backHref || actions) && (
          <div
            className="
              flex
              shrink-0
              flex-wrap
              items-center
              gap-2
              sm:justify-end
            "
          >
            {actions}

            {backHref ? (
              <BackButton
                href={backHref}
                label={backLabel}
              />
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
