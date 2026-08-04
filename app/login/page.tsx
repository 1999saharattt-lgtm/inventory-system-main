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
            px-8
            py-8
            text-center
            text-white
          "
        >


          <img
            src="/images/dohl-logo.png"
            alt="logo"
            width={80}
            height={80}
            className="
              mx-auto
              mb-5
              rounded-full
              bg-white
              p-2
            "
          />



          <h1
            className="
              text-3xl
              font-extrabold
              leading-tight
              !text-white
            "
          >
            ระบบบริหารงานคลังพัสดุ
          </h1>


          <p
            className="
              mt-3
              text-lg
              font-semibold
              text-slate-200
            "
          >
            สำนักอนามัยการเจริญพันธุ์
          </p>



        </div>






        {/* Form */}

        <div
          className="
            p-8
          "
        >


          <h2
            className="
              mb-6
              text-center
              text-2xl
              font-extrabอด
              font-extrabold
              text-slate-800
            "
          >
            เข้าสู่ระบบ
          </h2>




          <form
            action={login}
            className="space-y-5"
          >



            <div>


              <label
                className="
                  mb-2
                  block
                  text-base
                  font-extrabold
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
                  text-base
                  font-extrabold
                  text-slate-700
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
                text-lg
                font-extrabold
                text-white
                shadow-lg
                transition
                hover:scale-[1.02]
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
              font-semibold
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


    </div>
  );
}