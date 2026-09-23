import {
  KeyRound,
  LockKeyhole,
  UserRound,
} from "lucide-react";

import { login } from "./action";

/* =========================================================
   LOGIN PAGE
========================================================= */

export default function LoginPage() {
  return (
    <main
      className="
        relative
        flex
        min-h-screen
        w-full
        items-center
        justify-center
        overflow-hidden

        bg-[#f5f7fb]

        px-4
        py-6

        sm:px-6
        sm:py-8

        lg:px-8
      "
    >
      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0

          bg-[radial-gradient(circle_at_10%_10%,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_90%_12%,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.10),transparent_38%),linear-gradient(to_bottom,#f8fafc_0%,#f1f5f9_55%,#eef2f7_100%)]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-32
          top-20
          h-[440px]
          w-[440px]
          rounded-full
          bg-blue-400/15
          blur-[110px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-32
          top-1/3
          h-[480px]
          w-[480px]
          rounded-full
          bg-emerald-300/10
          blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          bottom-[-220px]
          left-1/2
          h-[420px]
          w-[760px]
          -translate-x-1/2
          rounded-full
          bg-cyan-300/10
          blur-[130px]
        "
      />

      {/* ===================================================
          LOGIN CONTAINER
      =================================================== */}

      <div
        className="
          relative
          z-10

          grid
          w-full
          max-w-[1180px]
          min-w-0

          overflow-hidden

          rounded-[32px]

          border
          border-white/80

          bg-white/70

          shadow-[0_32px_90px_-35px_rgba(15,23,42,0.38)]

          backdrop-blur-2xl

          lg:grid-cols-[1.05fr_0.95fr]
        "
      >
        {/* =================================================
            LEFT : BRAND
        ================================================= */}

        <section
          className="
            relative

            flex
            min-h-[300px]
            items-center
            justify-center

            overflow-hidden

            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-slate-800

            px-6
            py-9

            text-center

            sm:min-h-[370px]
            sm:px-10
            sm:py-12

            lg:min-h-[660px]
            lg:px-14
            lg:py-14
          "
        >
          {/* AMBIENT LIGHT */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -left-28
              -top-28
              h-80
              w-80
              rounded-full
              bg-blue-400/20
              blur-[90px]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -bottom-32
              -right-24
              h-96
              w-96
              rounded-full
              bg-cyan-400/15
              blur-[100px]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              h-[320px]
              w-[320px]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-white/[0.03]
              blur-3xl
            "
          />

          {/* BRAND CONTENT */}

          <div
            className="
              relative
              z-10
              mx-auto
              w-full
              max-w-xl
            "
          >
            {/* LOGO */}

            <div className="flex w-full justify-center">
              <div
                className="
                  relative

                  flex
                  h-28
                  w-28
                  items-center
                  justify-center

                  overflow-hidden

                  rounded-[28px]

                  border
                  border-white/70

                  bg-white/95

                  p-3

                  shadow-[0_24px_60px_-22px_rgba(0,0,0,0.7)]

                  ring-1
                  ring-white/20

                  sm:h-36
                  sm:w-36

                  lg:h-40
                  lg:w-40
                "
              >
                <img
                  src="/images/dohl-logo.png"
                  alt="โลโก้กรมอนามัย"
                  className="
                    h-full
                    w-full
                    object-contain
                  "
                />
              </div>
            </div>

            {/* SYSTEM NAME */}

            <div className="mt-6 sm:mt-7">
              <h1
                className="
                  text-2xl
                  font-black
                  leading-tight
                  tracking-tight
                  !text-white

                  sm:text-3xl

                  lg:text-[34px]
                "
              >
                ระบบบริหารคลังพัสดุ
              </h1>

              <p
                className="
                  mt-4

                  text-base
                  font-bold
                  leading-relaxed
                  !text-slate-200

                  sm:text-xl
                "
              >
                สำนักอนามัยการเจริญพันธุ์
              </p>

              <p
                className="
                  mt-1

                  text-xs
                  font-semibold
                  !text-slate-400

                  sm:text-base
                "
              >
                กรมอนามัย กระทรวงสาธารณสุข
              </p>
            </div>

            {/* DIVIDER */}

            <div
              className="
                mx-auto
                my-6

                h-px
                w-24

                bg-gradient-to-r
                from-transparent
                via-slate-500
                to-transparent

                sm:my-7
              "
            />

            {/* ENGLISH NAME */}

            <p
              className="
                text-xs
                font-semibold
                leading-relaxed
                tracking-wide
                !text-slate-400

                sm:text-base
              "
            >
              Reproductive Health Inventory Management System
            </p>
          </div>
        </section>

        {/* =================================================
            RIGHT : LOGIN
        ================================================= */}

        <section
          className="
            relative

            flex
            items-center
            justify-center

            bg-white/80

            px-5
            py-9

            backdrop-blur-2xl

            sm:px-10
            sm:py-12

            lg:px-12
            lg:py-14

            xl:px-16
          "
        >
          {/* AMBIENT */}

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
              bg-blue-300/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              z-10

              mx-auto
              w-full
              max-w-[440px]
            "
          >
            {/* =============================================
                TOP LOGIN ICON
            ============================================= */}

            <div
              className="
                mb-8

                flex
                w-full
                flex-col
                items-center
                justify-center

                text-center
              "
            >
              <div
                className="
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center

                  rounded-[20px]

                  border
                  border-slate-200/80

                  bg-white/95

                  !text-blue-600

                  shadow-[0_14px_35px_-20px_rgba(15,23,42,0.4)]

                  ring-1
                  ring-black/[0.025]
                "
                aria-hidden="true"
              >
                <LockKeyhole
                  size={28}
                  strokeWidth={2}
                />
              </div>

              {/* ไม่มีคำว่า "เข้าสู่ระบบ" ตรงนี้แล้ว */}

              <p
                className="
                  mt-4
                  w-full

                  text-center
                  text-sm
                  font-semibold
                  leading-relaxed
                  !text-slate-500

                  sm:text-base
                "
              >
                กรุณากรอกข้อมูลบัญชีผู้ใช้งานของคุณ
              </p>
            </div>

            {/* =============================================
                FORM
            ============================================= */}

            <form
              action={login}
              className="space-y-5"
            >
              {/* ===========================================
                  USERNAME
              =========================================== */}

              <div>
                <label
                  htmlFor="username"
                  className="
                    mb-2
                    block

                    text-sm
                    font-extrabold
                    !text-slate-700

                    sm:text-base
                  "
                >
                  รหัสผู้ใช้งาน
                </label>

                {/* ICON + INPUT แยกออกจากกัน */}

                <div
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                  "
                >
                  {/* USER ICON OUTSIDE INPUT */}

                  <div
                    className="
                      flex
                      h-[56px]
                      w-[56px]
                      shrink-0
                      items-center
                      justify-center

                      rounded-[17px]

                      border
                      border-slate-200

                      bg-white

                      !text-slate-500

                      shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]

                      ring-1
                      ring-black/[0.02]
                    "
                    aria-hidden="true"
                  >
                    <UserRound
                      size={21}
                      strokeWidth={2}
                    />
                  </div>

                  {/* USER INPUT */}

                  <input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="กรอกรหัสผู้ใช้งาน"
                    autoComplete="username"
                    required
                    className="
                      h-[56px]
                      min-w-0
                      flex-1

                      rounded-[17px]

                      border
                      border-slate-300/90

                      bg-slate-50/80

                      px-4
                      py-3

                      text-base
                      font-bold
                      !text-slate-900

                      shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]

                      outline-none

                      transition-all
                      duration-200

                      placeholder:font-semibold
                      placeholder:!text-slate-400

                      hover:border-slate-400
                      hover:bg-white

                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/10
                    "
                  />
                </div>
              </div>

              {/* ===========================================
                  PASSWORD
              =========================================== */}

              <div>
                <label
                  htmlFor="password"
                  className="
                    mb-2
                    block

                    text-sm
                    font-extrabold
                    !text-slate-700

                    sm:text-base
                  "
                >
                  รหัสผ่าน
                </label>

                {/* ICON + INPUT แยกออกจากกัน */}

                <div
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                  "
                >
                  {/* PASSWORD ICON OUTSIDE INPUT */}

                  <div
                    className="
                      flex
                      h-[56px]
                      w-[56px]
                      shrink-0
                      items-center
                      justify-center

                      rounded-[17px]

                      border
                      border-slate-200

                      bg-white

                      !text-slate-500

                      shadow-[0_8px_24px_-18px_rgba(15,23,42,0.45)]

                      ring-1
                      ring-black/[0.02]
                    "
                    aria-hidden="true"
                  >
                    <KeyRound
                      size={21}
                      strokeWidth={2}
                    />
                  </div>

                  {/* PASSWORD INPUT */}

                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="กรอกรหัสผ่าน"
                    autoComplete="current-password"
                    required
                    className="
                      h-[56px]
                      min-w-0
                      flex-1

                      rounded-[17px]

                      border
                      border-slate-300/90

                      bg-slate-50/80

                      px-4
                      py-3

                      text-base
                      font-bold
                      !text-slate-900

                      shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]

                      outline-none

                      transition-all
                      duration-200

                      placeholder:font-semibold
                      placeholder:!text-slate-400

                      hover:border-slate-400
                      hover:bg-white

                      focus:border-blue-500
                      focus:bg-white
                      focus:ring-4
                      focus:ring-blue-500/10
                    "
                  />
                </div>
              </div>

              {/* ===========================================
                  LOGIN BUTTON
              =========================================== */}

              <button
                type="submit"
                className="
                  mt-2

                  flex
                  h-[56px]
                  w-full
                  items-center
                  justify-center
                  gap-2.5

                  rounded-[17px]

                  border
                  border-blue-500/20

                  bg-gradient-to-r
                  from-blue-600
                  to-blue-500

                  px-5

                  text-base
                  font-extrabold
                  !text-white

                  shadow-[0_14px_30px_-16px_rgba(37,99,235,0.75)]

                  transition-all
                  duration-200

                  hover:-translate-y-0.5
                  hover:from-blue-500
                  hover:to-blue-400

                  hover:shadow-[0_18px_34px_-16px_rgba(37,99,235,0.8)]

                  active:translate-y-0
                  active:scale-[0.99]

                  sm:text-lg
                "
              >
                <LockKeyhole
                  size={19}
                  strokeWidth={2.2}
                  aria-hidden="true"
                />

                <span>
                  เข้าสู่ระบบ
                </span>
              </button>
            </form>

            {/* =============================================
                FOOTER
            ============================================= */}

            <div
              className="
                mt-8

                border-t
                border-slate-200

                pt-5

                text-center
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  !text-slate-400

                  sm:text-sm
                "
              >
                © {new Date().getFullYear()} ระบบบริหารคลังพัสดุ
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  font-semibold
                  !text-slate-400
                "
              >
                กลุ่มอำนวยการ (งานพัสดุ)
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}