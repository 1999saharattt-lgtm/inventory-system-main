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

      {/* LEFT GLOW */}

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

      {/* RIGHT GLOW */}

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

      {/* BOTTOM GLOW */}

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
            LEFT
            BRAND
        ================================================= */}

        <section
          className="
            relative

            flex
            min-h-[330px]
            items-center
            justify-center

            overflow-hidden

            bg-gradient-to-br
            from-slate-950
            via-slate-900
            to-slate-800

            px-6
            py-10

            text-center

            sm:min-h-[380px]
            sm:px-10
            sm:py-12

            lg:min-h-[660px]
            lg:px-14
            lg:py-14
          "
        >
          {/* BLUE GLOW */}

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

          {/* CYAN GLOW */}

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

          {/* INNER LIGHT */}

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

          {/* CONTENT */}

          <div
            className="
              relative
              z-10

              mx-auto
              w-full
              max-w-xl
            "
          >
            {/* =============================================
                LOGO
            ============================================= */}

            <div
              className="
                flex
                w-full
                justify-center
              "
            >
              <div
                className="
                  relative

                  flex
                  h-32
                  w-32
                  items-center
                  justify-center

                  overflow-hidden

                  rounded-[30px]

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

            {/* =============================================
                SYSTEM NAME
            ============================================= */}

            <div className="mt-7">
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

                  text-lg
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

                  text-sm
                  font-semibold
                  !text-slate-400

                  sm:text-base
                "
              >
                กรมอนามัย กระทรวงสาธารณสุข
              </p>
            </div>

            {/* =============================================
                DIVIDER
            ============================================= */}

            <div
              className="
                mx-auto
                my-7

                h-px
                w-24

                bg-gradient-to-r
                from-transparent
                via-slate-500
                to-transparent
              "
            />

            {/* =============================================
                ENGLISH NAME
            ============================================= */}

            <p
              className="
                text-sm
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
            RIGHT
            LOGIN FORM
        ================================================= */}

        <section
          className="
            relative

            flex
            items-center
            justify-center

            bg-white/75

            px-5
            py-8

            backdrop-blur-2xl

            sm:px-10
            sm:py-10

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
              max-w-[430px]
            "
          >
            {/* =============================================
                LOGIN ICON
            ============================================= */}

            <div
              className="
                mb-6

                flex
                h-14
                w-14
                items-center
                justify-center

                rounded-[18px]

                border
                border-slate-200/80

                bg-white/90

                text-2xl

                shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)]
              "
              aria-hidden="true"
            >
              🔐
            </div>

            {/* =============================================
                TITLE
            ============================================= */}

            <div className="mb-8">
              <h2
                className="
                  text-3xl
                  font-black
                  leading-tight
                  tracking-tight
                  !text-slate-900

                  sm:text-4xl
                "
              >
                เข้าสู่ระบบ
              </h2>

              <p
                className="
                  mt-2

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
              className="
                space-y-5
              "
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

                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-y-0
                      left-4

                      flex
                      items-center

                      text-lg
                    "
                  >
                    👤
                  </div>

                  <input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="กรอกรหัสผู้ใช้งาน"
                    autoComplete="username"
                    required
                    className="
                      h-[54px]
                      w-full

                      rounded-[16px]

                      border
                      border-slate-300

                      bg-slate-50/80

                      py-3
                      pl-12
                      pr-4

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

                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-y-0
                      left-4

                      flex
                      items-center

                      text-lg
                    "
                  >
                    🔑
                  </div>

                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="กรอกรหัสผ่าน"
                    autoComplete="current-password"
                    required
                    className="
                      h-[54px]
                      w-full

                      rounded-[16px]

                      border
                      border-slate-300

                      bg-slate-50/80

                      py-3
                      pl-12
                      pr-4

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
                  h-[54px]
                  w-full
                  items-center
                  justify-center
                  gap-2

                  rounded-[16px]

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
                <span aria-hidden="true">
                  🔐
                </span>

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