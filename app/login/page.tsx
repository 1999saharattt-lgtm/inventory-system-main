import { login } from "./action";

export default function LoginPage() {
  return (
    <main
      className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-slate-800
        px-4
        py-6
        sm:px-6
        sm:py-8
      "
    >
      {/* Background Decoration */}

      <div
        className="
          pointer-events-none
          absolute
          -left-24
          -top-24
          h-64
          w-64
          rounded-full
          bg-blue-500/10
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-24
          -right-24
          h-72
          w-72
          rounded-full
          bg-cyan-400/10
          blur-3xl
        "
      />

      {/* Login Card */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-[430px]
          overflow-hidden
          rounded-2xl
          border
          border-slate-700
          bg-slate-900
          shadow-2xl
          sm:rounded-3xl
        "
      >
        {/* =====================================================
            Header
        ===================================================== */}

        <div
          className="
            relative
            overflow-hidden
            border-b
            border-slate-700
            bg-gradient-to-r
            from-slate-950
            via-slate-800
            to-slate-700
            px-5
            py-6
            text-center
            sm:px-8
            sm:py-8
          "
        >
          {/* Header Glow */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-0
              h-32
              w-32
              -translate-x-1/2
              rounded-full
              bg-blue-400/10
              blur-3xl
            "
          />

          {/* Logo */}

          <div
            className="
              relative
              mx-auto
              mb-4
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-2xl
              border
              border-white/30
              bg-white
              p-2
              shadow-xl
              sm:mb-5
              sm:h-24
              sm:w-24
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

          {/* System Name */}

          <h1
            className="
              relative
              text-xl
              font-extrabold
              leading-tight
              tracking-tight
              !text-white
              sm:text-2xl
              md:text-3xl
            "
          >
            ระบบบริหารคลังพัสดุ
          </h1>

          <p
            className="
              relative
              mt-2
              text-sm
              font-semibold
              leading-relaxed
              !text-slate-200
              sm:mt-3
              sm:text-base
            "
          >
            สำนักอนามัยการเจริญพันธุ์
            <br className="sm:hidden" />
            <span className="sm:ml-1">
              กรมอนามัย
            </span>
          </p>
        </div>

        {/* =====================================================
            Form
        ===================================================== */}

        <div
          className="
            bg-gradient-to-b
            from-slate-900
            to-slate-950
            px-5
            py-6
            sm:px-8
            sm:py-8
          "
        >
          {/* Form Title */}

          <div className="mb-5 text-center sm:mb-6">
            <h2
              className="
                text-xl
                font-extrabold
                !text-white
                sm:text-2xl
              "
            >
              เข้าสู่ระบบ
            </h2>

            <p
              className="
                mt-1
                text-xs
                font-medium
                !text-slate-400
                sm:text-sm
              "
            >
              กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
            </p>
          </div>

          <form
            action={login}
            className="space-y-4 sm:space-y-5"
          >
            {/* Username */}

            <div>
              <label
                htmlFor="username"
                className="
                  mb-2
                  block
                  text-sm
                  font-extrabold
                  !text-slate-200
                  sm:text-base
                "
              >
                รหัสผู้ใช้งาน
              </label>

              <input
                id="username"
                type="text"
                name="username"
                placeholder="กรุณากรอกรหัสผู้ใช้งาน"
                autoComplete="username"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-600
                  bg-slate-800
                  px-4
                  py-3
                  text-base
                  font-medium
                  !text-white
                  placeholder:text-slate-500
                  outline-none
                  transition-all
                  duration-200
                  focus:border-blue-500
                  focus:bg-slate-800
                  focus:ring-4
                  focus:ring-blue-500/10
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
                  font-extrabold
                  !text-slate-200
                  sm:text-base
                "
              >
                รหัสผ่าน
              </label>

              <input
                id="password"
                type="password"
                name="password"
                placeholder="กรุณากรอกรหัสผ่าน"
                autoComplete="current-password"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-600
                  bg-slate-800
                  px-4
                  py-3
                  text-base
                  font-medium
                  !text-white
                  placeholder:text-slate-500
                  outline-none
                  transition-all
                  duration-200
                  focus:border-blue-500
                  focus:bg-slate-800
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              />
            </div>

            {/* Login Button */}

            <button
              type="submit"
              className="
                mt-2
                flex
                w-full
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-green-500
                px-4
                py-3
                text-base
                font-extrabold
                !text-white
                shadow-lg
                shadow-emerald-950/30
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:from-emerald-500
                hover:to-green-400
                hover:shadow-xl
                active:translate-y-0
                sm:py-3.5
                sm:text-lg
              "
            >
              <span className="mr-2">
                🔐
              </span>
              เข้าสู่ระบบ
            </button>
          </form>

          {/* =====================================================
              Footer
          ===================================================== */}

          <div
            className="
              mt-6
              border-t
              border-slate-700
              pt-4
              text-center
              sm:mt-7
              sm:pt-5
            "
          >
            <div
              className="
                text-xs
                font-semibold
                !text-slate-500
                sm:text-sm
              "
            >
              © {new Date().getFullYear()} ระบบบริหารคลังพัสดุ
            </div>

            <div
              className="
                mt-1
                text-[11px]
                font-semibold
                !text-slate-500
                sm:text-xs
              "
            >
              กลุ่มอำนวยการ (งานพัสดุ)
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}