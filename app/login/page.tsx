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
        px-4
        py-6
        sm:px-6
      "
    >
      <div
        className="
          w-full
          max-w-[430px]
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          shadow-2xl
        "
      >
        {/* Header */}

        <div
          className="
            bg-gradient-to-r
            from-slate-950
            via-slate-800
            to-slate-700
            px-5
            py-7
            text-center
            sm:px-8
            sm:py-8
          "
        >
          <div
            className="
              mx-auto
              mb-4
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-2xl
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

          <h1
            className="
              text-2xl
              font-bold
              leading-tight
              tracking-tight
              !text-white
              sm:text-3xl
            "
          >
            ระบบบริหารคลังพัสดุ
          </h1>

          <p
            className="
              mt-2
              text-sm
              font-medium
              leading-relaxed
              !text-slate-200
              sm:text-base
            "
          >
            สำนักอนามัยการเจริญพันธุ์ กรมอนามัย
          </p>
        </div>

        {/* Form */}

        <div
          className="
            px-5
            py-7
            sm:px-8
            sm:py-8
          "
        >
          <div className="mb-6 text-center">
            <h2
              className="
                text-2xl
                font-bold
                text-slate-800
              "
            >
              เข้าสู่ระบบ
            </h2>

            <p
              className="
                mt-1.5
                text-sm
                font-normal
                text-slate-500
              "
            >
              กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
            </p>
          </div>

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
                  py-3
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
                  py-3
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
                sm:py-3.5
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
              mt-7
              border-t
              border-slate-200
              pt-5
              text-center
            "
          >
            <div
              className="
                text-xs
                font-medium
                text-slate-400
                sm:text-sm
              "
            >
              © {new Date().getFullYear()} ระบบบริหารคลังพัสดุ
            </div>

            <div
              className="
                mt-1
                text-xs
                font-normal
                text-slate-400
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