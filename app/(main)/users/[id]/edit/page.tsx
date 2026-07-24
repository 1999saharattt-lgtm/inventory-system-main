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
      <div
        className="
          rounded-xl
          border
          border-slate-300
          bg-white
          p-6
          text-xl
          font-bold
          text-slate-600
          shadow-md
        "
      >
        ไม่พบผู้ใช้งาน
      </div>
    );
  }





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
          แก้ไขผู้ใช้งานระบบ
        </h1>


        <p
          className="
            mt-2
            text-xl
            font-bold
            text-slate-600
          "
        >
          แก้ไขข้อมูลบัญชี สิทธิ์ และสถานะการใช้งาน
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
          action={updateUser}
          className="space-y-5"
        >



          <input
            type="hidden"
            name="id"
            value={user.id}
          />





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
              defaultValue={user.username}
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
              defaultValue={user.fullname}
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
              Password ใหม่
            </label>


            <input
              type="password"
              name="password"
              placeholder="เว้นว่างไว้ถ้าไม่เปลี่ยนรหัสผ่าน"
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
              defaultValue={user.role}
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

            <label
              className="
                mb-2
                block
                text-xl
                font-extrabold
                text-slate-700
              "
            >
              สถานะ
            </label>


            <select
              name="active"
              defaultValue={String(user.active)}
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
                font-extrabอด
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
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