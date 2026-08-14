import { login } from "./action";

export default function LoginPage() {
  return (
    <div
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-slate-100
        px-3
        sm:px-4
      "
    >
      <div
        className="
          w-full
          max-w-md
          overflow-hidden
          rounded-2xl
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
            py-6
            text-center
            text-white
            sm:px-8
            sm:py-8
          "
        >
          <img
            src="/images/dohl-logo.png"
            alt="logo"
            width={80}
            height={80}
            className="
              mx-auto
              mb-4
              h-16
              w-16
              rounded-full
              bg-white
              p-2
              sm:mb-5
              sm:h-20
              sm:w-20
            "
          />

          <h1
            className="
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-3xl
            "
          >
            ระบบบริหารงานคลังพัสดุ
          </h1>

          <p
            className="
              mt-2
              text-base
              font-semibold
              text-slate-200
              sm:mt-3
              sm:text-lg
            "
          >
            สำนักอนามัยการเจริญพันธุ์ กรมอนามัย
          </p>
        </div>

        {/* Form */}

        <div
          className="
            p-5
            sm:p-8
          "
        >
          <h2
            className="
              mb-5
              text-center
              text-xl
              font-extrabอด
              font-extrabold
              text-slate-800
              sm:mb-6
              sm:text-2xl
            "
          >
            เข้าสู่ระบบ
          </h2>

          <form
            action={login}
            className="space-y-4 sm:space-y-5"
          >
            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-extrabold
                  text-slate-700
                  sm:text-base
                "
              >
                รหัสผู้ใช้งาน
              </label>

              <input
                type="text"
                name="username"
                placeholder="ชื่อผู้ใช้งาน"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  text-base
                  font-medium
                  text-slate-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              />
            </div>

            <div>
              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-extrabold
                  text-slate-700
                  sm:text-base
                "
              >
                รหัสผ่าน
              </label>

              <input
                type="password"
                name="password"
                placeholder="รหัสผ่าน"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  text-base
                  font-medium
                  text-slate-900
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-4
                  focus:ring-blue-100
                "
              />
            </div>

            <button
              type="submit"
              className="
                mt-3
                w-full
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-green-500
                py-3
                text-base
                font-extrabold
                text-white
                shadow-lg
                transition
                hover:scale-[1.02]
                sm:text-lg
              "
            >
              🔐 เข้าสู่ระบบ
            </button>
          </form>

          {/* Footer */}

          <div
            className="
              mt-6
              border-t
              border-slate-200
              pt-4
              text-center
              text-xs
              font-semibold
              text-slate-500
              sm:mt-8
              sm:pt-5
              sm:text-sm
            "
          >
            <div>
              © {new Date().getFullYear()}
            </div>

            <div className="mt-1">
              กลุ่มอำนวยการ (งานพัสดุ)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}