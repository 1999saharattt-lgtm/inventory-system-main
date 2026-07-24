import { logout } from "@/app/logout/action";
import { requireLogin } from "@/lib/auth";

export default async function Header() {
  const user = await requireLogin();

  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        items-center
        justify-between
        border-b
        border-slate-200
        bg-white/95
        backdrop-blur
        px-8
        py-4
        shadow-sm
      "
    >
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">
          ระบบบริหารคลังพัสดุ
        </h1>

        <p className="text-base font-medium text-slate-500">
          สำนักอนามัยการเจริญพันธุ์
        </p>
      </div>

      {/* User */}
      <div className="flex items-center gap-4">
        <div
          className="
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-2
            text-right
            shadow-sm
          "
        >
          <div className="text-lg font-bold text-slate-800">
            {user.fullname}
          </div>

          <div className="text-sm font-semibold text-blue-600">
            {user.role}
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="
              rounded-xl
              bg-red-600
              px-5
              py-2.5
              text-lg
              font-bold
              text-white
              shadow-md
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:bg-red-700
              hover:shadow-lg
            "
          >
            ออกจากระบบ
          </button>
        </form>
      </div>
    </header>
  );
}