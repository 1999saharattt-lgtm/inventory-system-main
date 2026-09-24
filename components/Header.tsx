import Image from "next/image";

import { logout } from "@/app/logout/action";
import { requireLogin } from "@/lib/auth";

import MobileMenu from "@/components/MobileMenu";

/* =========================================================
   HEADER
========================================================= */

export default async function Header() {
  const user =
    await requireLogin();

  /* =======================================================
     ROLE
  ======================================================= */

  const role =
    String(
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

  /* =======================================================
     UI
  ======================================================= */

  return (
    <header
      className="
        sticky
        top-0
        z-50

        w-full

        px-2
        pt-2

        sm:px-3
        sm:pt-3

        lg:px-4
      "
    >
      {/* =====================================================
          GLASS HEADER
      ===================================================== */}

      <div
        className="
          relative
          mx-auto
          w-full
          max-w-[1920px]
          overflow-hidden

          rounded-[26px]

          border
          border-white/80

          bg-white/80

          shadow-[0_18px_55px_-32px_rgba(15,23,42,0.50)]

          backdrop-blur-2xl
          backdrop-saturate-150

          ring-1
          ring-slate-900/[0.025]
        "
      >
        {/* ===================================================
            AMBIENT LIGHT
        =================================================== */}

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
            right-1/4
            -top-20

            absolute

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

        {/* ===================================================
            TOP HIGHLIGHT
        =================================================== */}

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

        {/* ===================================================
            CONTENT
        =================================================== */}

        <div
          className="
            relative
            z-10

            flex
            min-h-[74px]
            w-full
            items-center
            justify-between
            gap-3

            px-3
            py-2.5

            sm:min-h-[82px]
            sm:gap-4
            sm:px-4
            sm:py-3

            md:px-5

            lg:px-6
          "
        >
          {/* =================================================
              LEFT AREA
          ================================================= */}

          <div
            className="
              flex
              min-w-0
              flex-1
              items-center
              gap-3

              sm:gap-4
            "
          >
            {/* ===============================================
                MOBILE MENU
            =============================================== */}

            <div
              className="
                shrink-0
                lg:hidden
              "
            >
              <MobileMenu
                role={user.role}
              />
            </div>

            {/* ===============================================
                BRAND
            =============================================== */}

            <div
              className="
                flex
                min-w-0
                flex-1
                items-center
                gap-3

                sm:gap-4
              "
            >
              {/* =============================================
                  LOGO
              ============================================= */}

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
                  border-white/90

                  bg-white/95

                  shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)]

                  ring-1
                  ring-slate-900/[0.04]

                  transition-all
                  duration-300
                  ease-out

                  hover:-translate-y-0.5
                  hover:scale-[1.03]

                  hover:shadow-[0_16px_34px_-18px_rgba(5,150,105,0.28)]

                  sm:h-14
                  sm:w-14

                  md:h-[58px]
                  md:w-[58px]
                "
              >
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-x-2
                    top-0

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

                    group-hover:scale-[1.03]
                  "
                  sizes="58px"
                />
              </div>

              {/* =============================================
                  SYSTEM NAME
              ============================================= */}

              <div
                className="
                  min-w-0
                  flex-1
                "
              >
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
                      truncate

                      text-base
                      font-black
                      tracking-[-0.02em]

                      !text-slate-950

                      sm:text-lg
                      md:text-xl
                      lg:text-[22px]
                    "
                  >
                    ระบบบริหารคลังพัสดุ
                    สำนักอนามัยการเจริญพันธุ์
                  </h1>

                  {/* =========================================
                      ONLINE INDICATOR
                  ========================================= */}

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

                {/* ===========================================
                    ENGLISH NAME
                =========================================== */}

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
          </div>

          {/* =================================================
              RIGHT AREA
          ================================================= */}

          <div
            className="
              flex
              shrink-0
              items-center
              gap-2

              sm:gap-3
            "
          >
            {/* ===============================================
                USER INFORMATION
            =============================================== */}

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

                backdrop-blur-xl

                ring-1
                ring-slate-900/[0.025]

                transition-all
                duration-300

                hover:bg-white/90

                hover:shadow-[0_14px_34px_-22px_rgba(15,23,42,0.50)]

                sm:flex

                md:px-3.5
              "
            >
              {/* =============================================
                  AVATAR
              ============================================= */}

              <div
                className="
                  relative

                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center

                  overflow-hidden

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

                  transition-all
                  duration-300

                  group-hover:scale-105

                  group-hover:border-emerald-300
                "
                aria-hidden="true"
              >
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-x-1
                    top-0

                    h-px

                    bg-white
                  "
                />

                <span
                  className="
                    relative
                    leading-none
                  "
                >
                  👤
                </span>
              </div>

              {/* =============================================
                  USER NAME / ROLE
              ============================================= */}

              <div
                className="
                  min-w-0
                  text-right
                "
              >
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

                      shadow-[0_0_8px_rgba(16,185,129,0.40)]
                    "
                  />

                  {roleText}
                </div>
              </div>

              {/* =============================================
                  DECORATION
              ============================================= */}

              <div
                className="
                  hidden

                  h-7
                  w-7

                  items-center
                  justify-center

                  rounded-full

                  bg-slate-100/80

                  text-sm
                  font-black

                  !text-slate-400

                  lg:flex
                "
                aria-hidden="true"
              >
                ›
              </div>
            </div>

            {/* ===============================================
                MOBILE USER
            =============================================== */}

            <div
              className="
                flex
                h-10
                w-10
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

                backdrop-blur-xl

                ring-1
                ring-white

                sm:hidden
              "
              title={`${user.fullname} · ${roleText}`}
            >
              👤
            </div>

            {/* ===============================================
                LOGOUT
            =============================================== */}

            <form action={logout}>
              <button
                type="submit"
                className="
                  group
                  relative

                  inline-flex
                  h-10

                  items-center
                  justify-center

                  overflow-hidden

                  whitespace-nowrap

                  rounded-[14px]

                  border
                  border-red-400/20

                  bg-gradient-to-b
                  from-red-500
                  to-rose-600

                  px-4

                  text-sm
                  font-extrabold

                  !text-white

                  shadow-[0_10px_24px_-14px_rgba(239,68,68,0.58)]

                  ring-1
                  ring-white/20

                  transition-all
                  duration-300
                  ease-out

                  hover:-translate-y-0.5

                  hover:from-red-500
                  hover:to-red-600

                  hover:shadow-[0_14px_30px_-14px_rgba(239,68,68,0.72)]

                  active:translate-y-0
                  active:scale-[0.96]

                  sm:h-11
                  sm:px-5
                "
              >
                {/* ===========================================
                    BUTTON HIGHLIGHT
                =========================================== */}

                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-x-1
                    top-px

                    h-px

                    bg-white/50
                  "
                />

                {/* ===========================================
                    TEXT
                =========================================== */}

                <span
                  className="
                    relative
                    hidden

                    sm:inline
                  "
                >
                  ออกจากระบบ
                </span>

                {/* ===========================================
                    MOBILE TEXT
                =========================================== */}

                <span
                  className="
                    relative

                    text-xs
                    font-black

                    sm:hidden
                  "
                >
                  ออก
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}