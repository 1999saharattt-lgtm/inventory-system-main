import Image from "next/image";
import { logout } from "@/app/logout/action";
import { requireLogin } from "@/lib/auth";
import MobileMenu from "@/components/MobileMenu";

export default async function Header() {
  const user = await requireLogin();

  return (
    <header
      className="
        relative
        w-full
        overflow-hidden
        border-b
        border-white/10
        bg-gradient-to-r
        from-slate-950/95
        via-slate-900/95
        to-slate-800/95
        px-3
        py-2.5
        shadow-[0_14px_40px_-24px_rgba(15,23,42,0.85)]
        backdrop-blur-2xl
        sm:px-5
        sm:py-3
        md:px-8
      "
    >
      {/* =====================================================
          Ambient Light
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-16
          -top-20
          h-44
          w-44
          rounded-full
          bg-blue-400/15
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-16
          -top-16
          h-40
          w-40
          rounded-full
          bg-emerald-400/10
          blur-3xl
        "
      />

      {/* =====================================================
          Header Content
      ===================================================== */}

      <div
        className="
          relative
          mx-auto
          flex
          w-full
          max-w-[1920px]
          items-center
          justify-between
          gap-3
          sm:gap-4
        "
      >
        {/* =====================================================
            Mobile Menu
        ===================================================== */}

        <div className="shrink-0 lg:hidden">
          <MobileMenu role={user.role} />
        </div>

        {/* =====================================================
            Logo + System Name
        ===================================================== */}

        <div className="min-w-0 flex-1">
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
              sm:gap-4
            "
          >
            {/* =================================================
                Logo
            ================================================= */}

            <div
              className="
                group
                relative
                h-12
                w-12
                shrink-0
                overflow-hidden
                rounded-[16px]
                border
                border-white/20
                bg-white/95
                shadow-[0_10px_30px_-14px_rgba(0,0,0,0.65)]
                ring-1
                ring-white/10
                transition-all
                duration-300
                ease-out
                hover:-translate-y-0.5
                hover:scale-[1.03]
                hover:shadow-[0_14px_34px_-14px_rgba(59,130,246,0.45)]
                sm:h-14
                sm:w-14
                md:h-16
                md:w-16
              "
            >
              <Image
                src="/images/dohl-logo.png"
                alt="โลโก้กรมอนามัย"
                fill
                priority
                className="
                  object-contain
                  p-1
                  transition-transform
                  duration-300
                  group-hover:scale-[1.03]
                "
                sizes="64px"
              />
            </div>

            {/* =================================================
                System Name
            ================================================= */}

            <div className="min-w-0">
              {/* Thai Name */}

              <h1
                className="
                  truncate
                  text-lg
                  font-black
                  tracking-tight
                  !text-white
                  sm:text-xl
                  md:text-2xl
                  lg:text-3xl
                "
              >
                ระบบบริหารคลังพัสดุ สำนักอนามัยการเจริญพันธุ์
              </h1>

              {/* English Name */}

              <p
                className="
                  mt-1
                  hidden
                  truncate
                  text-sm
                  font-bold
                  tracking-[0.03em]
                  !text-slate-200
                  md:block
                  md:text-base
                  lg:text-lg
                "
              >
                Reproductive Health Inventory Management System
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            User Area
        ===================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            gap-2
            sm:gap-3
          "
        >
          {/* =================================================
              User Information
          ================================================= */}

          <div
            className="
              group
              hidden
              items-center
              gap-2.5
              rounded-[18px]
              border
              border-white/15
              bg-white/10
              px-3
              py-2
              shadow-[0_10px_26px_-18px_rgba(0,0,0,0.7)]
              backdrop-blur-xl
              transition-all
              duration-300
              hover:bg-white/15
              sm:flex
              sm:px-3.5
            "
          >
            {/* User Icon */}

            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-[13px]
                bg-white/15
                text-base
                ring-1
                ring-white/10
                transition-transform
                duration-300
                group-hover:scale-105
              "
            >
              👤
            </div>

            {/* User Name + Role */}

            <div className="min-w-0 text-right">
              <div
                className="
                  max-w-[130px]
                  truncate
                  whitespace-nowrap
                  text-sm
                  font-extrabold
                  !text-white
                  md:max-w-[180px]
                "
              >
                {user.fullname}
              </div>

              <div
                className="
                  mt-0.5
                  flex
                  items-center
                  justify-end
                  gap-1.5
                  whitespace-nowrap
                  text-[11px]
                  font-extrabold
                  uppercase
                  tracking-wide
                  !text-sky-300
                "
              >
                {/* Online Status */}

                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-emerald-400
                    shadow-[0_0_10px_rgba(52,211,153,0.7)]
                  "
                />

                {user.role}
              </div>
            </div>
          </div>

          {/* =================================================
              Mobile User Badge
          ================================================= */}

          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-[14px]
              border
              border-white/15
              bg-white/10
              text-base
              shadow-sm
              backdrop-blur-xl
              sm:hidden
            "
            title={`${user.fullname} · ${user.role}`}
          >
            👤
          </div>

          {/* =================================================
              Logout
          ================================================= */}

          <form action={logout}>
            <button
              type="submit"
              className="
                group
                inline-flex
                h-10
                items-center
                justify-center
                gap-2
                whitespace-nowrap
                rounded-[14px]
                border
                border-red-300/20
                bg-gradient-to-r
                from-red-600
                to-rose-500
                px-3
                text-sm
                font-extrabold
                !text-white
                shadow-[0_10px_24px_-14px_rgba(239,68,68,0.75)]
                transition-all
                duration-300
                ease-out
                hover:-translate-y-0.5
                hover:from-red-700
                hover:to-rose-600
                hover:shadow-[0_14px_28px_-14px_rgba(239,68,68,0.85)]
                active:translate-y-0
                active:scale-[0.96]
                sm:h-11
                sm:px-4
              "
            >
              {/* Logout Icon */}

              <span
                className="
                  transition-transform
                  duration-300
                  group-hover:-translate-x-0.5
                "
              >
                ↪
              </span>

              {/* Logout Text */}

              <span className="hidden sm:inline">
                ออกจากระบบ
              </span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}