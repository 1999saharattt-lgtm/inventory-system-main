import type { ReactNode } from "react";

type AppPageProps = {
  children: ReactNode;
  className?: string;
};

export default function AppPage({
  children,
  className = "",
}: AppPageProps) {
  return (
    <div
      className={`
        relative
        isolate
        w-full
        min-w-0
        overflow-hidden
        rounded-[32px]
        bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_24%),linear-gradient(to_bottom,_#f8fafc,_#eef2f7)]
        p-3
        sm:p-4
        lg:p-5
        ${className}
      `}
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-24
          top-8
          -z-10
          h-72
          w-72
          rounded-full
          bg-blue-300/20
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-24
          top-40
          -z-10
          h-80
          w-80
          rounded-full
          bg-emerald-300/15
          blur-3xl
        "
      />

      <div className="w-full min-w-0 space-y-4 sm:space-y-5">
        {children}
      </div>
    </div>
  );
}
