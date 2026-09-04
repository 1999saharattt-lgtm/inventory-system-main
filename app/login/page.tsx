import { login } from "./action";

export default function LoginPage() {
  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-gradient-to-br
        from-slate-100
        via-blue-50
        to-slate-200
        p-4
        sm:p-6
      "
    >
      <div
        className="
          grid
          w-full
          max-w-6xl
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          shadow-2xl
          lg:grid-cols-[1.15fr_0.85fr]
        "
      >
        {/* =====================================================
            LEFT : BRANDING
        ===================================================== */}

        <section
          className="
            relative
            flex
            min-h-[360px]
            items-center
            justify-center
            overflow-hidden
            bg-gradient-to-br
            from-slate-950
            via-slate-800
            to-slate-700
            px-6
            py-10
            sm:px-10
            sm:py-12
            lg:min-h-[650px]
            lg:px-16
          "
        >
          {/* Background Decoration */}

          <div
            className="
              pointer-events-none
              absolute
              -left-24
              -top-24
              h-72
              w-72
              rounded-full
              bg-blue-400/10
              blur-3xl
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-32
              -right-24
              h-80
              w-80
              rounded-full
              bg-cyan-400/10
              blur-3xl
            "
          />

          {/* Branding Content */}

          <div
            className="
              relative
              z-10
              w-full
              max-w-xl
              text-center
              lg:text-left
            "
          >
            {/* Logo */}

            <div
              className="
                mb-6
                flex
                justify-center
                lg:justify-start
              "
            >
              <div
                className="
                  flex
                  h-28
                  w-28
                  items-center
                  justify-center
                  rounded-3xl
                  bg-white
                  p-3
                  shadow-2xl
                  sm:h-32
                  sm:w-32
                  lg:h-36
                  lg:w-36
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

            {/* System Name */}

            <h1
              className="
                text-3xl
                font-bold
                leading-tight
                tracking-tight
                !text-white
                sm:text-4xl
                lg:text-5xl
              "
            >
              ระบบบริหารคลังพัสดุ
            </h1>

            {/* Organization */}

            <p
              className="
                mt-4
                text-lg
                font-medium
                leading-relaxed
                !text-slate-200
                sm:text-xl
                lg:text-2xl
              "
            >
              สำนักอนามัยการเจริญพันธุ์
            </p>

            <p
              className="
                mt-1
                text-base
                font-normal
                !text-slate-300
                sm:text-lg
              "
            >
              กรมอนามัย
            </p>

            {/* Divider */}

            <div
              className="
                mx-auto
                my-7
                h-px
                w-24
                bg-slate-500
                lg:mx-0
              "
            />

            {/* Description */}

            <p
              className="
                max-w-md
                text-sm
                font-normal
                leading-relaxed
                !text-slate-300
                sm:text-base
              "
            >
              ระบบสำหรับบริหารจัดการวัสดุ พัสดุ
              <br className="hidden sm:block" />
              และครุภัณฑ์ของหน่วยงาน
            </p>
          </div>
        </section>

        {/* =====================================================
            RIGHT : LOGIN
        ===================================================== */}

        <section
          className="
            flex
            items-center
            bg-white
            px-5
            py-8
            sm:px-10
            sm:py-10
            lg:px-12
            xl:px-16
          "
        >
          <div className="mx-auto w-full max-w-md">
            {/* Login Heading */}

            <div className="mb-7">
              <h2
                className="
                  text-3xl
                  font-bold
                  text-slate-800
                  sm:text-4xl
                "
              >
                เข้าสู่ระบบ
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  font-normal
                  leading-relaxed
                  text-slate-500
                  sm:text-base
                "
              >
                กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
              </p>
            </div>

            {/* Login Form */}

            <form
              action={login}
              className="space-y-5"
            >
              {/* Username */}

              <div>
                <label
                  htmlFor="username"
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    sm:text-base
                  "
                >
                  รหัสผู้ใช้งาน
                </label>

                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="ชื่อผู้ใช้งาน"
                  autoComplete="username"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-slate-50
                    px-4
                    py-3.5
                    text-base
                    font-normal
                    text-slate-900
                    outline-none
                    transition-all
                    duration-200
                    placeholder:text-slate-400
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />
              </div>

              {/* Password */}

              <div>
                <label
                  htmlFor="password"
                  className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                    sm:text-base
                  "
                >
                  รหัสผ่าน
                </label>

                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="รหัสผ่าน"
                  autoComplete="current-password"
                  className="
                    w-full
                    rounded-xl
                    border
                    border-slate-300
                    bg-slate-50
                    px-4
                    py-3.5
                    text-base
                    font-normal
                    text-slate-900
                    outline-none
                    transition-all
                    duration-200
                    placeholder:text-slate-400
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-100
                  "
                />
              </div>

              {/* Login Button */}

              <button
                type="submit"
                className="
                  mt-3
                  flex
                  w-full
                  items-center
                  justify-center
                  rounded-xl
                  bg-gradient-to-r
                  from-emerald-600
                  to-green-500
                  px-4
                  py-3.5
                  text-base
                  font-bold
                  !text-white
                  shadow-lg
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:from-emerald-500
                  hover:to-green-400
                  hover:shadow-xl
                  active:translate-y-0
                  sm:py-4
                  sm:text-lg
                "
              >
                <span className="mr-2 text-base">
                  🔐
                </span>

                เข้าสู่ระบบ
              </button>
            </form>

            {/* Footer */}

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
                  font-normal
                  text-slate-400
                  sm:text-sm
                "
              >
                © {new Date().getFullYear()} ระบบบริหารคลังพัสดุ
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  font-normal
                  text-slate-400
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