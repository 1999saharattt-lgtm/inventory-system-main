import Image from "next/image";

import { logout } from "@/app/logout/action";
import { requireLogin } from "@/lib/auth";

import MobileMenu from "@/components/MobileMenu";
import AppButton from "@/components/AppButton";

import {
  LogOut,
  UserRound,
  ShieldCheck,
} from "lucide-react";

export default async function Header() {
  const user = await requireLogin();

  return (
    <header
      className="
        relative

        w-full

        overflow-hidden

        border-b
        border-white/[0.08]

        bg-[linear-gradient(115deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.97)_45%,rgba(30,41,59,0.96)_100%)]

        px-3
        py-3

        shadow-[0_18px_50px_-30px_rgba(2,6,23,0.95)]

        backdrop-blur-2xl

        sm:px-5
        sm:py-3.5

        md:px-8
      "
    >
      {/* =====================================================
          TOP INNER HIGHLIGHT
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0

          h-px

          bg-gradient-to-r
          from-transparent
          via-white/25
          to-transparent
        "
      />

      {/* =====================================================
          LEFT AMBIENT LIGHT
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-20
          -top-24

          h-56
          w-56

          rounded-full

          bg-blue-500/20

          blur-[70px]
        "
      />

      {/* =====================================================
          CENTER AMBIENT LIGHT
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-[42%]
          -top-24

          h-44
          w-80

          rounded-full

          bg-sky-400/[0.07]

          blur-[80px]
        "
      />

      {/* =====================================================
          RIGHT AMBIENT LIGHT
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20

          h-52
          w-52

          rounded-full

          bg-emerald-400/[0.12]

          blur-[75px]
        "
      />

      {/* =====================================================
          CONTENT
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
        {/* ===================================================
            MOBILE MENU
        =================================================== */}

        <div className="shrink-0 lg:hidden">
          <MobileMenu role={user.role} />
        </div>

        {/* ===================================================
            BRAND
        =================================================== */}

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
            {/* ===============================================
                LOGO TILE
            =============================================== */}

            <div
              className="
                group
                relative

                flex
                h-[54px]
                w-[54px]
                shrink-0

                items-center
                justify-center

                overflow-hidden

                rounded-[18px]

                border
                border-white/25

                bg-gradient-to-br
                from-white
                via-slate-50
                to-slate-100

                shadow-[0_14px_35px_-16px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,1)]

                ring-1
                ring-black/[0.06]

                transition-all
                duration-300
                ease-out

                hover:-translate-y-0.5
                hover:scale-[1.025]

                hover:shadow-[0_18px_40px_-16px_rgba(14,165,233,0.4),inset_0_1px_0_rgba(255,255,255,1)]

                sm:h-[60px]
                sm:w-[60px]

                md:h-[66px]
                md:w-[66px]
                md:rounded-[20px]
              "
            >
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  inset-x-2
                  top-1

                  h-px

                  bg-white
                "
              />

              <Image
                src="/images/dohl-logo.png"
                alt="โลโก้กรมอนามัย"
                fill
                priority
                className="
                  object-contain

                  p-1.5

                  transition-transform
                  duration-300

                  group-hover:scale-[1.035]
                "
                sizes="66px"
              />
            </div>

            {/* ===============================================
                SYSTEM NAME
            =============================================== */}

            <div className="min-w-0">
              <div
                className="
                  flex
                  min-w-0
                  items-center
                  gap-2
                "
              >
                <h1
                  className="
                    truncate

                    text-lg
                    font-black
                    tracking-[-0.025em]

                    !text-white

                    sm:text-xl

                    md:text-2xl

                    xl:text-[27px]
                  "
                >
                  ระบบบริหารคลังพัสดุ สำนักอนามัยการเจริญพันธุ์
                </h1>
              </div>

              <div
                className="
                  mt-1
                  hidden

                  items-center
                  gap-2

                  md:flex
                "
              >
                <span
                  className="
                    h-1
                    w-1

                    shrink-0

                    rounded-full

                    bg-sky-400

                    shadow-[0_0_8px_rgba(56,189,248,0.75)]
                  "
                />

                <p
                  className="
                    truncate

                    text-[11px]
                    font-semibold
                    tracking-[0.025em]

                    !text-slate-300

                    lg:text-xs
                  "
                >
                  Reproductive Health Inventory Management System
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            RIGHT ACTIONS
        =================================================== */}

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
              USER CARD
          ================================================= */}

          <div
            className="
              group

              hidden

              items-center

              gap-2.5

              rounded-[20px]

              border
              border-white/[0.12]

              bg-white/[0.07]

              px-3
              py-2

              shadow-[0_12px_30px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)]

              backdrop-blur-2xl

              transition-all
              duration-300
              ease-out

              hover:-translate-y-0.5
              hover:border-white/[0.18]
              hover:bg-white/[0.1]

              sm:flex

              md:px-3.5
            "
          >
            {/* Avatar */}

            <div
              className="
                relative

                flex
                h-10
                w-10
                shrink-0

                items-center
                justify-center

                rounded-[14px]

                border
                border-white/[0.1]

                bg-gradient-to-br
                from-white/[0.16]
                to-white/[0.06]

                shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]

                transition-transform
                duration-300

                group-hover:scale-[1.04]
              "
            >
              <UserRound
                size={19}
                strokeWidth={2.2}
                className="text-slate-100"
              />

              <span
                className="
                  absolute
                  -bottom-0.5
                  -right-0.5

                  h-3
                  w-3

                  rounded-full

                  border-2
                  border-slate-900

                  bg-emerald-400

                  shadow-[0_0_9px_rgba(52,211,153,0.75)]
                "
              />
            </div>

            {/* User Details */}

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

                  gap-1

                  whitespace-nowrap

                  text-[10px]
                  font-extrabold
                  uppercase
                  tracking-[0.06em]

                  !text-sky-300
                "
              >
                <ShieldCheck
                  size={11}
                  strokeWidth={2.4}
                />

                {user.role}
              </div>
            </div>
          </div>

          {/* =================================================
              MOBILE USER
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
              border-white/[0.12]

              bg-white/[0.08]

              shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]

              backdrop-blur-xl

              sm:hidden
            "
            title={`${user.fullname} · ${user.role}`}
          >
            <UserRound
              size={18}
              strokeWidth={2.2}
              className="text-white"
            />
          </div>

          {/* =================================================
              LOGOUT
              ใช้ AppButton กลาง
          ================================================= */}

          <form action={logout}>
            <AppButton
              type="submit"
              variant="danger"
              size="md"
              icon={
                <LogOut
                  size={17}
                  strokeWidth={2.4}
                  aria-hidden="true"
                />
              }
            >
              <span className="hidden sm:inline">
                ออกจากระบบ
              </span>
            </AppButton>
          </form>
        </div>
      </div>
    </header>
  );
}