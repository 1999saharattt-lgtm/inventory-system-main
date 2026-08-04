import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";


async function createUser(formData: FormData) {
  "use server";

  await requireRole("ADMIN");


  const username = formData.get("username") as string;
  const fullname = formData.get("fullname") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "ADMIN" | "STAFF" | "VIEWER";


  const hashedPassword = await bcrypt.hash(password, 10);



  await prisma.user.create({
    data: {
      username,
      fullname,
      password: hashedPassword,
      role,
    },
  });


  redirect("/users");
}





export default async function CreateUserPage() {

  await requireRole("ADMIN");


  return (

    <div className="space-y-6">



      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-8
          py-6
          min-h-[140px]
          text-white
          shadow-xl
        "
      >


        <div>


          <h1
            className="
              text-5xl
              font-extrabold
              leading-tight
              !text-white
            "
          >
            👤 เพิ่มผู้ใช้งานระบบ
          </h1>



          <p
            className="
              mt-2
              text-xl
              font-semibold
              !text-slate-200
            "
          >
            สร้างบัญชีผู้ใช้งานและกำหนดสิทธิ์การเข้าใช้งานระบบ
          </p>


        </div>





        <Link
          href="/users"

          className="
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-5
            py-3
            text-lg
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
          "
        >
          ← กลับ
        </Link>


      </div>







      {/* Form Card */}


      <div
        className="
          max-w-2xl
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-8
          shadow-xl
        "
      >



        <form

          action={createUser}

          className="space-y-6"

        >





          {[
            {
              label:"Username",
              name:"username",
              type:"text",
            },
            {
              label:"ชื่อ-นามสกุล",
              name:"fullname",
              type:"text",
            },
            {
              label:"Password",
              name:"password",
              type:"password",
            },

          ].map((field)=>(


            <div key={field.name}>


              <label
                className="
                  mb-2
                  block
                  text-lg
                  font-extrabold
                  text-slate-700
                "
              >
                {field.label}
              </label>



              <input

                type={field.type}

                name={field.name}

                required


                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-4
                  py-3
                  text-lg
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


          ))}







          <div>


            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-slate-700
              "
            >
              สิทธิ์การใช้งาน
            </label>



            <select

              name="role"


              className="
                w-full
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-lg
                font-medium
                text-slate-900
                outline-none
                transition
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-100
              "

            >


              <option value="STAFF">
                STAFF
              </option>


              <option value="ADMIN">
                ADMIN
              </option>


              <option value="VIEWER">
                VIEWER
              </option>


            </select>


          </div>







          <button

            type="submit"

            className="
              rounded-xl
              bg-gradient-to-r
              from-emerald-600
              to-green-500
              px-8
              py-3
              text-lg
              font-extrabold
              text-white
              shadow-lg
              transition
              hover:scale-105
            "

          >
            บันทึก
          </button>




        </form>


      </div>


    </div>

  );
}