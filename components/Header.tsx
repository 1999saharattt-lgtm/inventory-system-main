import Image from "next/image";

import { logout } from "@/app/logout/action";
import { requireLogin } from "@/lib/auth";

import MobileMenu from "@/components/MobileMenu";

/* =========================================================
   HEADER
========================================================= */

export default async function Header() {
  const user = await requireLogin();

  const role = String(
    user.role ?? ""
  )
    .trim()
    .toUpperCase();

  const roleText =
    role === "ADMIN"
      ? "ผู้ดูแลระบบ"
      : role === "STAFF"
        ? "เจ้าหน้าที่"
        : role === "VIEWER"
          ? "ผู้ใช้งาน"
          : role;

  return (
    <header
      className="
        sticky
        top-0
        z-[5000]

        w-full

        px-2
        pt-2

        sm:px-3
        sm:pt-3

        lg:px-4
      "
    >
      {/* =====================================================
          MAIN HEADER
          มือถือและ Desktop ใช้ Header ชุดเดียวกัน
      ===================================================== */}

      <div
        className="
          relative
          mx-auto
          w-full
          max-w-[1920px]

          overflow-hidden

          rounded-[24px]

          border
          border-white/80

          bg-white/80

          shadow-[0_18px_55px_-32px_rgba(15,23,42,0.50)]

          ring-1
          ring-slate-900/[0.025]

          backdrop-blur-2xl
          backdrop-saturate-150
        "
      >
        {/* AMBIENT */}

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

            bg-emerald-300/20

            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            right-1/4
            -top-20

            h-40
            w-40

            rounded-full

            bg-cyan-200/20

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

            bg-emerald-200/25

            blur-3xl
          "
        />

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
            via-white
            to-transparent
          "
        />

        {/* CONTENT */}

        <div
          className="
            relative
            z-10

            flex
            min-h-[66px]
            w-full
            min-w-0

            items-center
            justify-between
            gap-2

            px-3
            py-2

            sm:min-h-[82px]
            sm:gap-4
            sm:px-4
            sm:py-3

            md:px-5
            lg:px-6
          "
        >
          {/* LEFT / BRAND */}

          <div
            className="
              flex
              min-w-0
              flex-1
              items-center
              gap-2.5

              sm:gap-4
            "
          >
            <div
              className="
                group
                relative

                h-11
                w-11
                shrink-0

                overflow-hidden

                rounded-[14px]

                border
                border-white/90

                bg-white/95

                shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)]

                ring-1
                ring-slate-900/[0.04]

                sm:h-14
                sm:w-14
                sm:rounded-[16px]

                md:h-[58px]
                md:w-[58px]
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

                  sm:p-1.5
                "
                sizes="58px"
              />
            </div>

            <div className="min-w-0 flex-1">
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
                    min-w-0

                    text-[12px]
                    font-black
                    leading-[1.25]
                    tracking-[-0.02em]

                    !text-slate-950

                    sm:text-lg
                    sm:leading-tight

                    md:text-xl

                    lg:text-[22px]
                  "
                >
                  <span className="block sm:inline">
                    ระบบบริหารคลังพัสดุ
                  </span>
                  <span className="block sm:ml-1 sm:inline">
                    สำนักอนามัยการเจริญพันธุ์
                  </span>
                </h1>

                <span
                  className="
                    hidden
                    h-2
                    w-2
                    shrink-0

                    rounded-full

                    bg-emerald-500

                    shadow-[0_0_0_4px_rgba(16,185,129,0.10)]

                    md:block
                  "
                  title="ระบบพร้อมใช้งาน"
                />
              </div>

              <p
                className="
                  mt-1
                  hidden
                  truncate

                  text-sm
                  font-bold
                  tracking-[0.02em]

                  !text-slate-500

                  md:block
                  md:text-[15px]

                  lg:text-base
                "
              >
                Reproductive Health Inventory Management System
              </p>
            </div>
          </div>

          {/* RIGHT */}

          <div
            className="
              flex
              shrink-0
              items-center
              gap-1.5

              sm:gap-3
            "
          >
            {/* DESKTOP / TABLET USER */}

            <div
              className="
                group
                hidden

                items-center
                gap-3

                rounded-[18px]

                border
                border-white/90

                bg-white/70

                px-3
                py-2

                shadow-[0_10px_30px_-22px_rgba(15,23,42,0.45)]

                ring-1
                ring-slate-900/[0.025]

                backdrop-blur-xl

                sm:flex
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center

                  rounded-[14px]

                  border
                  border-emerald-200/80

                  bg-gradient-to-br
                  from-emerald-50
                  via-white
                  to-green-100

                  text-xl

                  shadow-sm

                  ring-1
                  ring-white
                "
                aria-hidden="true"
              >
                👤
              </div>

              <div className="min-w-0 text-right">
                <div
                  className="
                    max-w-[120px]
                    truncate
                    whitespace-nowrap

                    text-sm
                    font-black

                    !text-slate-800

                    md:max-w-[170px]
                    xl:max-w-[220px]
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

                    !text-emerald-700
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-1.5

                      rounded-full

                      bg-emerald-500
                    "
                  />

                  {roleText}
                </div>
              </div>
            </div>

            {/* MOBILE USER */}

            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center

                text-[21px]

                sm:hidden
              "
              title={`${user.fullname} · ${roleText}`}
              aria-label={`${user.fullname} · ${roleText}`}
            >
              👤
            </div>

            {/* LOGOUT */}

            <form action={logout}>
              <button
                type="submit"
                className="
                  group
                  relative

                  inline-flex
                  h-9
                  items-center
                  justify-center

                  overflow-hidden
                  whitespace-nowrap

                  rounded-[13px]

                  border
                  border-red-400/20

                  bg-gradient-to-b
                  from-red-500
                  to-rose-600

                  px-2.5

                  text-xs
                  font-extrabold
                  !text-white

                  shadow-[0_10px_24px_-14px_rgba(239,68,68,0.58)]

                  ring-1
                  ring-white/20

                  transition-all
                  duration-200

                  active:scale-[0.96]

                  sm:h-11
                  sm:px-5
                  sm:text-sm
                "
              >
                <span className="hidden sm:inline">
                  ออกจากระบบ
                </span>

                <span className="sm:hidden">
                  ออก
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* =====================================================
          MOBILE NAVIGATION
          อยู่นอกกรอบ Header
          ไม่มี wrapper สีขาว
      ===================================================== */}

      <div
        className="
          relative
          z-[5100]

          mx-auto
          mt-1

          w-full
          max-w-[1920px]

          bg-transparent

          lg:hidden
        "
      >
        <MobileMenu
          role={user.role}
        />
      </div>
    </header>
  );
}
