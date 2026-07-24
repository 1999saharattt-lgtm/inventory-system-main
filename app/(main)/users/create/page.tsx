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
    <div className="space-y-8">


      {/* Header */}

      <div
        className="
          rounded-xl
          border
          border-slate-300
          bg-white
          p-6
          shadow-md
        "
      >

        <h1
          className="
            text-4xl
            font-extrabold
            text-slate-800
          "
        >
          เพิ่มผู้ใช้งานระบบ
        </h1>


        <p
          className="
            mt-2
            text-xl
            font-bold
            text-slate-600
          "
        >
          สร้างบัญชีผู้ใช้งานและกำหนดสิทธิ์การเข้าใช้งานระบบ
        </p>


      </div>





      {/* Form */}

      <div
        className="
          max-w-2xl
          rounded-xl
          border
          border-slate-300
          bg-white
          p-6
          shadow-md
        "
      >


        <form
          action={createUser}
          className="space-y-5"
        >




          <div>

            <label
              className="
                mb-2
                block
                text-xl
                font-extrabold
                text-slate-700
              "
            >
              Username
            </label>


            <input
              name="username"
              required
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                px-4
                py-3
                text-xl
                font-bold
                outline-none
                focus:border-blue-500
              "
            />

          </div>






          <div>

            <label
              className="
                mb-2
                block
                text-xl
                font-extrabold
                text-slate-700
              "
            >
              ชื่อ-นามสกุล
            </label>


            <input
              name="fullname"
              required
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                px-4
                py-3
                text-xl
                font-bold
                outline-none
                focus:border-blue-500
              "
            />

          </div>






          <div>

            <label
              className="
                mb-2
                block
                text-xl
                font-extrabold
                text-slate-700
              "
            >
              Password
            </label>


            <input
              type="password"
              name="password"
              required
              className="
                w-full
                rounded-lg
                border
                border-slate-300
                px-4
                py-3
                text-xl
                font-bold
                outline-none
                focus:border-blue-500
              "
            />

          </div>







          <div>

            <label
              className="
                mb-2
                block
                text-xl
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
                rounded-lg
                border
                border-slate-300
                px-4
                py-3
                text-xl
                font-bold
                outline-none
                focus:border-blue-500
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






          <div
            className="
              flex
              gap-3
              pt-4
            "
          >


            <Link
              href="/users"
              className="
                rounded-lg
                bg-slate-600
                px-6
                py-3
                text-xl
                font-extrabold
                text-white
                shadow-sm
                transition
                hover:bg-slate-700
              "
            >
              ← กลับ
            </Link>





            <button
              className="
                rounded-lg
                bg-blue-600
                px-6
                py-3
                text-xl
                font-extrabold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
            >
              บันทึก
            </button>


          </div>




        </form>


      </div>


    </div>
  );
}