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
        gap-8
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

      <div
        className="
          w-[430px]
          shrink-0
        "
      >

        <h1
          className="
            whitespace-nowrap
            text-2xl
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
            text-lg
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
          gap-4
          shrink-0
        "
      >


        <div
          className="
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            px-5
            py-2
            text-right
            shadow-sm
          "
        >

          <div
            className="
              whitespace-nowrap
              text-lg
              font-extrabold
              text-slate-800
            "
          >
            {user.fullname}
          </div>


          <div
            className="
              whitespace-nowrap
              text-base
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
              rounded-xl
              bg-red-600
              px-5
              py-2
              text-xl
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