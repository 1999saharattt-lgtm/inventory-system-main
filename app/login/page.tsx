import {
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import AppButton from "@/components/AppButton";

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

        bg-[#f3f8f5]

        px-3
        py-5

        sm:px-5
        sm:py-7

        lg:px-8
      "
    >
      {/* ===================================================
          BACKGROUND
          iOS Glass + Department of Health Green
      =================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0

          bg-[radial-gradient(circle_at_8%_8%,rgba(16,185,129,0.20),transparent_30%),radial-gradient(circle_at_92%_10%,rgba(5,150,105,0.16),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(20,184,166,0.12),transparent_40%),linear-gradient(to_bottom,#f8fcfa_0%,#f1f8f4_50%,#edf6f1_100%)]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-36
          top-12
          h-[460px]
          w-[460px]
          rounded-full
          bg-emerald-400/15
          blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-32
          top-1/3
          h-[500px]
          w-[500px]
          rounded-full
          bg-green-400/10
          blur-[130px]
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
          w-[780px]
          -translate-x-1/2
          rounded-full
          bg-teal-300/10
          blur-[140px]
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

          bg-white/65

          shadow-[0_32px_90px_-35px_rgba(15,23,42,0.30)]

          ring-1
          ring-black/[0.025]

          backdrop-blur-2xl

          lg:grid-cols-[1.02fr_0.98fr]
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
            from-emerald-950
            via-emerald-900
            to-green-800

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
              bg-emerald-300/20
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
              bg-green-300/15
              blur-[105px]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              h-[340px]
              w-[340px]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-white/[0.04]
              blur-3xl
            "
          />

          {/* DECORATIVE GLASS CIRCLES */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              right-8
              top-8
              h-24
              w-24
              rounded-full
              border
              border-white/10
              bg-white/[0.04]
              backdrop-blur-xl
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              bottom-10
              left-10
              h-16
              w-16
              rounded-[22px]
              border
              border-white/10
              bg-white/[0.04]
              backdrop-blur-xl
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

                  rounded-[30px]

                  border
                  border-white/75

                  bg-white/95

                  p-3

                  shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]

                  ring-1
                  ring-white/30

                  backdrop-blur-2xl

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
                  !text-emerald-50

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
                  !text-emerald-100/75

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
                w-28

                bg-gradient-to-r
                from-transparent
                via-emerald-100/50
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
                !text-emerald-100/65

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

            bg-white/78

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
              h-56
              w-56
              rounded-full
              bg-emerald-300/12
              blur-3xl
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              -bottom-20
              -left-20
              absolute
              h-52
              w-52
              rounded-full
              bg-green-200/15
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

                  rounded-[21px]

                  border
                  border-emerald-100/90

                  bg-gradient-to-b
                  from-white
                  to-emerald-50/80

                  !text-emerald-700

                  shadow-[0_16px_36px_-20px_rgba(5,150,105,0.45)]

                  ring-1
                  ring-black/[0.025]
                "
                aria-hidden="true"
              >
                <ShieldCheck
                  size={29}
                  strokeWidth={2}
                />
              </div>

              <h2
                className="
                  mt-5

                  text-2xl
                  font-black
                  tracking-tight
                  !text-slate-900

                  sm:text-[28px]
                "
              >
                เข้าสู่ระบบ
              </h2>

              <p
                className="
                  mt-2
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

                <div
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                  "
                >
                  {/* USER ICON */}

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
                      border-emerald-100

                      bg-gradient-to-b
                      from-white
                      to-emerald-50/70

                      !text-emerald-700

                      shadow-[0_8px_24px_-18px_rgba(5,150,105,0.45)]

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

                      border-2
                      !border-black

                      bg-white/90

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

                      hover:bg-white

                      focus:!border-emerald-600
                      focus:bg-white
                      focus:ring-4
                      focus:ring-emerald-500/10
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

                <div
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                  "
                >
                  {/* PASSWORD ICON */}

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
                      border-emerald-100

                      bg-gradient-to-b
                      from-white
                      to-emerald-50/70

                      !text-emerald-700

                      shadow-[0_8px_24px_-18px_rgba(5,150,105,0.45)]

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

                      border-2
                      !border-black

                      bg-white/90

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

                      hover:bg-white

                      focus:!border-emerald-600
                      focus:bg-white
                      focus:ring-4
                      focus:ring-emerald-500/10
                    "
                  />
                </div>
              </div>

              {/* ===========================================
                  LOGIN BUTTON
                  ใช้ AppButton ตัวกลางของระบบ
              =========================================== */}

              <div className="pt-1">
                <AppButton
                  type="submit"
                  variant="success"
                  size="lg"
                  fullWidth
                  icon={
                    <LockKeyhole
                      size={19}
                      strokeWidth={2.2}
                      aria-hidden="true"
                    />
                  }
                >
                  เข้าสู่ระบบ
                </AppButton>
              </div>
            </form>

            {/* =============================================
                SECURITY INFO
            ============================================= */}

            <div
              className="
                mt-6

                rounded-[18px]

                border
                border-emerald-100/90

                bg-emerald-50/60

                px-4
                py-3

                text-center

                shadow-sm
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-center
                  gap-2

                  text-xs
                  font-bold
                  !text-emerald-800

                  sm:text-sm
                "
              >
                <LockKeyhole
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <span>
                  ระบบสำหรับผู้ใช้งานที่ได้รับอนุญาต
                </span>
              </div>
            </div>

            {/* =============================================
                FOOTER
            ============================================= */}

            <div
              className="
                mt-7

                border-t
                border-slate-200/90

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
