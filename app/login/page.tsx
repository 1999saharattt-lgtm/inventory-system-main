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
        px-4
      "
    >

      {/* Login Card */}
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-8
          shadow-lg
        "
      >

        {/* Header */}
        <div className="mb-8 text-center">

          <div className="mx-auto mb-5 flex justify-center">
            <img
              src="/images/dohl-logo.png"
              alt="logo"
              width={90}
              height={90}
            />
          </div>


          <h1
            className="
              text-3xl
              font-extrabold
              text-slate-800
            "
          >
            ระบบบริหารงานคลังพัสดุ
          </h1>


          <h2
            className="
              mt-3
              text-xl
              font-bold
              text-blue-700
            "
          >
            สำนักอนามัยการเจริญพันธุ์
          </h2>


          <p
            className="
              mt-5
              text-2xl
              font-extrabold
              text-slate-700
            "
          >
            เข้าสู่ระบบ
          </p>

        </div>



        {/* Form */}
        <form action={login} className="space-y-5">


          <div>

            <label
              className="
                mb-2
                block
                text-sm
                font-bold
                text-slate-700
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
                text-slate-800
                outline-none
                transition
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
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-base
                font-medium
                text-slate-800
                outline-none
                transition
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
              bg-blue-700
              py-3
              text-lg
              font-bold
              text-white
              shadow-md
              transition
              hover:bg-blue-800
              hover:shadow-lg
              active:scale-95
            "
          >
            🔐 เข้าสู่ระบบ
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
            text-sm
            font-medium
            text-slate-500
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
  );
}