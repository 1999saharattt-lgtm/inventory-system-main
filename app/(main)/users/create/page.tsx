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
    <div className="max-w-xl">


      <div
        className="
          rounded-xl
          border
          bg-white
          p-6
          shadow
        "
      >


        <h1
          className="
            mb-6
            text-2xl
            font-bold
            text-slate-800
          "
        >
          เพิ่มผู้ใช้งานระบบ
        </h1>




        <form
          action={createUser}
          className="space-y-4"
        >



          <div>

            <label className="block mb-1">
              Username
            </label>

            <input
              name="username"
              required
              className="
                w-full
                rounded-lg
                border
                px-3
                py-2
              "
            />

          </div>





          <div>

            <label className="block mb-1">
              ชื่อ-นามสกุล
            </label>

            <input
              name="fullname"
              required
              className="
                w-full
                rounded-lg
                border
                px-3
                py-2
              "
            />

          </div>





          <div>

            <label className="block mb-1">
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
                px-3
                py-2
              "
            />

          </div>





          <div>

            <label className="block mb-1">
              สิทธิ์
            </label>

            <select
              name="role"
              className="
                w-full
                rounded-lg
                border
                px-3
                py-2
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





          <div className="flex gap-3 pt-4">


            <Link
              href="/users"
              className="
                rounded-lg
                bg-slate-600
                px-5
                py-3
                font-semibold
                text-white
                hover:bg-slate-700
              "
            >
              ← กลับ
            </Link>




            <button
              className="
                rounded-lg
                bg-blue-700
                px-5
                py-3
                font-semibold
                text-white
                hover:bg-blue-800
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