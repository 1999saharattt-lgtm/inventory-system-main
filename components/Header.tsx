import Image from "next/image";
import { logout } from "@/app/logout/action";
import { requireLogin } from "@/lib/auth";
import MobileMenu from "@/components/MobileMenu";

export default async function Header() {
  const user = await requireLogin();

  return (
    <header
      className="
        sticky
        top-0
        z-30
        w-full
        border-b
        border-slate-200
        bg-white/95
        px-3
        py-2
        shadow-sm
        backdrop-blur
        sm:px-5
        sm:py-3
        md:px-8
      "
    >
      <div
        className="
          flex
          w-full
          items-center
          justify-between
          gap-3
          sm:gap-4
        "
      >
        {/* Mobile Menu */}
        <div className="shrink-0 lg:hidden">
          <MobileMenu role={user.role} />
        </div>

        {/* System Logo + Name */}
        <div
          className="
            flex
            min-w-0
            flex-1
            items-center
          "
        >
          <div
            className="
              flex
              min-w-0
              w-fit
              max-w-full
              items-center
              gap-3
              rounded-2xl
              border
              border-slate-700
              bg-gradient-to-br
              from-slate-950
              to-slate-800
              px-3
              py-2
              shadow-xl
              sm:gap-4
              sm:px-5
              sm:py-3
            "
          >
            {/* Logo */}
            <div
              className="
                relative
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                bg-white
                shadow-lg
                sm:h-16
                sm:w-16
              "
            >
              <Image
                src="/logo.png"
                alt="โลโก้สำนักอนามัยการเจริญพันธุ์"
                fill
                priority
                className="object-contain p-1"
                sizes="64px"
              />
            </div>

            {/* System Name */}
            <div
              className="
                min-w-0
                whitespace-nowrap
                text-2xl
                font-extrabold
                tracking-tight
                text-white
                sm:text-4xl
                md:text-5xl
              "
            >
              ระบบบริหารคลังพัสดุ สำนักอนามัยการเจริญพันธุ์
            </div>
          </div>
        </div>

        {/* User */}
        <div
          className="
            flex
            shrink-0
            items-center
            gap-2
            sm:gap-3
          "
        >
          <div
            className="
              rounded-xl
              border
              border-slate-200
              bg-white
              px-3
              py-1.5
              text-right
              shadow-sm
              sm:px-5
              sm:py-2
            "
          >
            <div
              className="
                max-w-[120px]
                truncate
                whitespace-nowrap
                text-sm
                font-extrabold
                text-slate-800
                sm:max-w-none
                sm:text-lg
              "
            >
              {user.fullname}
            </div>

            <div
              className="
                whitespace-nowrap
                text-xs
                font-bold
                text-blue-600
                sm:text-base
              "
            >
              {user.role}
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="
                whitespace-nowrap
                rounded-xl
                bg-red-600
                px-3
                py-2
                text-sm
                font-extrabold
                text-white
                shadow-lg
                transition
                hover:bg-red-700
                sm:px-5
                sm:text-base
              "
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}