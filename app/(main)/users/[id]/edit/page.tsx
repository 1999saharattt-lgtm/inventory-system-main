import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";


async function updateUser(formData: FormData) {
  "use server";

  await requireRole("ADMIN");


  const id = Number(formData.get("id"));

  const username = formData.get("username") as string;
  const fullname = formData.get("fullname") as string;
  const role = formData.get("role") as "ADMIN" | "STAFF" | "VIEWER";
  const active = formData.get("active") === "true";

  const password = formData.get("password") as string;



  const existingUser = await prisma.user.findFirst({
    where: {
      username,
      NOT: {
        id,
      },
    },
  });


  if (existingUser) {
    throw new Error("Username นี้ถูกใช้งานแล้ว");
  }



  const data: {
    username: string;
    fullname: string;
    role: "ADMIN" | "STAFF" | "VIEWER";
    active: boolean;
    password?: string;
  } = {
    username,
    fullname,
    role,
    active,
  };



  if (password.trim() !== "") {
    data.password = await bcrypt.hash(password, 10);
  }



  await prisma.user.update({
    where: {
      id,
    },
    data,
  });


  redirect("/users");
}





export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {


  await requireRole("ADMIN");


  const { id } = await params;


  const user = await prisma.user.findUnique({
    where: {
      id: Number(id),
    },
  });



  if (!user) {
    return (
      <div>
        ไม่พบผู้ใช้งาน
      </div>
    );
  }





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
          "
        >
          แก้ไขผู้ใช้งานระบบ
        </h1>





        <form
          action={updateUser}
          className="space-y-4"
        >



          <input
            type="hidden"
            name="id"
            value={user.id}
          />





          <div>

            <label>
              Username
            </label>

            <input
              name="username"
              defaultValue={user.username}
              required
              className="
                mt-1
                w-full
                rounded-lg
                border
                px-3
                py-2
              "
            />

          </div>





          <div>

            <label>
              ชื่อ-นามสกุล
            </label>

            <input
              name="fullname"
              defaultValue={user.fullname}
              required
              className="
                mt-1
                w-full
                rounded-lg
                border
                px-3
                py-2
              "
            />

          </div>





          <div>

            <label>
              Password ใหม่
            </label>

            <input
              type="password"
              name="password"
              placeholder="เว้นว่างไว้ถ้าไม่เปลี่ยนรหัสผ่าน"
              className="
                mt-1
                w-full
                rounded-lg
                border
                px-3
                py-2
              "
            />

          </div>





          <div>

            <label>
              สิทธิ์
            </label>


            <select
              name="role"
              defaultValue={user.role}
              className="
                mt-1
                w-full
                rounded-lg
                border
                px-3
                py-2
              "
            >

              <option value="ADMIN">
                ADMIN
              </option>

              <option value="STAFF">
                STAFF
              </option>

              <option value="VIEWER">
                VIEWER
              </option>


            </select>


          </div>





          <div>

            <label>
              สถานะ
            </label>


            <select
              name="active"
              defaultValue={String(user.active)}
              className="
                mt-1
                w-full
                rounded-lg
                border
                px-3
                py-2
              "
            >

              <option value="true">
                Active
              </option>

              <option value="false">
                Inactive
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
              บันทึกการแก้ไข
            </button>


          </div>



        </form>


      </div>


    </div>

  );
}