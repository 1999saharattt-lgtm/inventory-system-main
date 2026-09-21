import Link from "next/link";

type BackButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

export default function BackButton({
  href,
  label = "← กลับ",
  className = "",
}: BackButtonProps) {
  return (
    <Link
      href={href}
      className={`
        inline-flex
        h-11
        w-[120px]
        shrink-0
        items-center
        justify-center
        rounded-xl
        border
        border-slate-300
        bg-white
        px-4
        text-base
        font-extrabold
        !text-black
        shadow-md
        transition
        hover:bg-slate-100
        hover:shadow-lg
        ${className}
      `}
    >
      {label}
    </Link>
  );
}