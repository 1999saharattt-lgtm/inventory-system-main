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
        w-full
        items-center
        justify-between
        gap-6
        border-b
        border-slate-200
        bg-white/95
        backdrop-blur
        px-6
        py-2
        shadow-sm
      "
    >

      {/* Title */}

      <div
        className="
          w-[360px]
          shrink-0
        "
      >

        <h1
          className="
            whitespace-nowrap
            text-xl
            font-extrabold
            leading-none
            text-slate-800
          "
        >
          ระบบบริหารคลังพัสดุ
        </h1>


        <p
          className="
            mt-1
            whitespace-nowrap
            text-base
            font-bold
            text-slate-500
          "
        >
          สำนักอนามัยการเจริญพันธุ์
        </p>

      </div>



      {/* User */}

      <div
        className="
          flex
          items-center
          gap-3
          shrink-0
        "
      >

        <div
          className="
            rounded-lg
            border
            border-slate-200
            bg-slate-50
            px-4
            py-1.5
            text-right
            shadow-sm
          "
        >

          <div
            className="
              whitespace-nowrap
              text-base
              font-extrabอด
              text-slate-800
            "
          >
            {user.fullname}
          </div>


          <div
            className="
              whitespace-nowrap
              text-sm
              font-bold
              text-blue-600
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
              rounded-lg
              bg-red-600
              px-4
              py-1.5
              text-base
              font-extrabold
              text-white
              shadow-md
              transition
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