import { logout } from "@/app/logout/action";
import { requireLogin } from "@/lib/auth";

export default async function Header() {
  const user = await requireLogin();

  return (
    <header className="relative flex items-center justify-end border-b bg-white px-6 py-4">

      {/* Center Title */}
      <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-slate-800">
        ยินดีต้อนรับเข้าสู่ระบบบริหารคลังพัสดุ สำนักอนามัยการเจริญพันธุ์
      </h1>


      {/* User */}
      <div className="flex items-center gap-4">

        <div className="text-right">

          <div className="font-bold text-slate-800">
            {user.fullname}
          </div>

          <div className="text-sm font-semibold text-gray-500">
            {user.role}
          </div>

        </div>


        <form action={logout}>
          <button
            type="submit"
            className="
              rounded-lg
              bg-red-600
              px-5
              py-2
              font-bold
              text-white
              hover:bg-red-700
            "
          >
            ออกจากระบบ
          </button>
        </form>

      </div>

    </header>
  );
}