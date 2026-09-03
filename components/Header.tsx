import Image from "next/image";
import { logout } from "@/app/logout/action";
import { requireLogin } from "@/lib/auth";
import MobileMenu from "@/components/MobileMenu";

export default async function Header() {
  const user = await requireLogin();

  return (
    <header
      className="
        w-full
        border-b
        border-slate-700
        bg-gradient-to-r
        from-slate-950
        via-slate-800
        to-slate-700
        px-3
        py-2
        shadow-xl
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
          sm:gap-5
        "
      >
        {/* Mobile Menu */}
        <div className="shrink-0 lg:hidden">
          <MobileMenu role={user.role} />
        </div>

        {/* Logo + System Name */}
        <div className="min-w-0 flex-1">
          <div
            className="
              flex
              items-center
              gap-3
              sm:gap-4
            "
          >
            {/* Logo */}
            <div
              className="
                relative
                h-14
                w-14
                shrink-0
                overflow-hidden
                rounded-lg
                bg-white
                shadow-lg
                sm:h-16
                sm:w-16
                md:h-[72px]
                md:w-[72px]
              "
            >
              <Image
                src="/images/dohl-logo.png"
                alt="โลโก้กรมอนามัย"
                fill
                priority
                className="object-contain p-1"
                sizes="72px"
              />
            </div>

            {/* System Name */}
            <h1
              className="
                whitespace-nowrap
                text-xl
                font-extrabold
                tracking-tight
                !text-white
                sm:text-2xl
                md:text-3xl
              "
            >
              ระบบบริหารคลังพัสดุ สำนักอนามัยการเจริญพันธุ์
            </h1>
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
              border-slate-300
              bg-white
              px-3
              py-1.5
              text-right
              shadow-lg
              sm:px-4
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
                sm:text-base
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
                sm:text-sm
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
                sm:px-4
                sm:text-sm
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