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
        flex
        w-full
        items-center
        justify-between
        gap-3
        border-b
        border-slate-200
        bg-white/95
        px-3
        py-2
        shadow-sm
        backdrop-blur
        sm:gap-4
        sm:px-5
        sm:py-3
        md:px-8
      "
    >
      {/* Mobile Menu */}
      <MobileMenu role={user.role} />

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

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
              max-w-[140px]
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
    </header>
  );
}