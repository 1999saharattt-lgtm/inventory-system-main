import { login } from "./action";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-100 px-4">

      {/* Background decoration */}
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-300/40 blur-3xl" />


      {/* Login Card */}
      <div className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl backdrop-blur">


        {/* Header */}
        <div className="mb-8 text-center">


          <div className="mx-auto mb-5 flex items-center justify-center">
            <img
              src="/images/dohl-logo.png"
              alt="logo"
              width={90}
              height={90}
            />
          </div>


          <h1 className="text-3xl font-extrabold leading-relaxed text-slate-800">
            ระบบบริหารงานคลังพัสดุ
          </h1>


          <h2 className="mt-2 text-xl font-bold text-blue-700">
            สำนักอนามัยการเจริญพันธุ์
          </h2>


          <p className="mt-4 text-2xl font-extrabold text-slate-700">
            Login
          </p>


        </div>



        {/* Login Form */}
        <form action={login} className="space-y-5">


          {/* Username */}
          <div>

            <label className="mb-2 block text-base font-bold text-slate-700">
              รหัสผู้ใช้งาน
            </label>


            <input
              type="text"
              name="username"
              placeholder="ชื่อผู้ใช้งาน"
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                py-3
                px-4
                text-base
                font-medium
                text-slate-800
                outline-none
                transition
                duration-300
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "
            />


            <input
              type="password"
              name="password"
              placeholder="รหัสผ่าน"
              className="
                mt-4
                w-full
                rounded-lg
                border
                border-slate-300
                bg-white
                py-3
                px-4
                text-base
                font-medium
                text-slate-800
                outline-none
                transition
                duration-300
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "
            />


          </div>



          {/* Button */}
          <button
            type="submit"
            className="
              w-full
              rounded-xl
              bg-gradient-to-r
              from-blue-600
              to-cyan-600
              py-3
              text-lg
              font-extrabold
              text-white
              shadow-lg
              transition-all
              duration-300
              hover:scale-[1.02]
              hover:shadow-xl
              active:scale-95
            "
          >
            🔐 เข้าสู่ระบบ
          </button>


        </form>



        {/* Footer */}
        <div className="mt-8 border-t pt-5 text-center text-sm font-medium text-slate-500">

          <div>
            © {new Date().getFullYear()}
          </div>

          <div className="mt-1">
            กลุ่มอำนวยการ (งานพัสดุ)
          </div>

        </div>


      </div>


    </div>
  );
}