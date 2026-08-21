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
  const role = formData.get("role") as
    | "ADMIN"
    | "STAFF"
    | "VIEWER";

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
    <div className="w-full min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">

      {/* Header */}

      <div
        className="
          flex
          w-full
          min-w-0
          flex-col
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          p-4
          text-white
          shadow-xl
          sm:gap-4
          sm:p-6
          md:flex-row
          md:items-center
          md:justify-between
        "
      >
        <div className="min-w-0 flex-1">

          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-4xl
              md:text-5xl
            "
          >
            👤 เพิ่มผู้ใช้งานระบบ
          </h1>

          <p
            className="
              mt-2
              break-words
              text-sm
              font-semibold
              leading-tight
              !text-slate-200
              sm:mt-3
              sm:text-xl
            "
          >
            สร้างบัญชีผู้ใช้งานและกำหนดสิทธิ์การเข้าใช้งานระบบ
          </p>

        </div>

        <Link
          href="/users"
          className="
            w-fit
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            py-2.5
            text-sm
            font-extrabold
            text-white
            shadow-lg
            transition
            hover:scale-105
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* Form */}

      <div
        className="
          w-full
          min-w-0
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-4
          shadow-xl
          sm:p-8
        "
      >

        <form
          action={createUser}
          className="space-y-6"
        >

          {/* Username */}

          <div>

            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-white
              "
            >
              Username
            </label>

            <input
              type="text"
              name="username"
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
                font-bold
                text-black
                outline-none
                transition
                focus:border-cyan-400
                focus:ring-4
                focus:ring-cyan-100
              "
            />

          </div>

          {/* ชื่อ-นามสกุล */}

          <div>

            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-white
              "
            >
              ชื่อ-นามสกุล
            </label>

            <input
              type="text"
              name="fullname"
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
                font-bold
                text-black
                outline-none
                transition
                focus:border-cyan-400
                focus:ring-4
                focus:ring-cyan-100
              "
            />

          </div>

          {/* Password */}

          <div>

            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-white
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
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-lg
                font-bold
                text-black
                outline-none
                transition
                focus:border-cyan-400
                focus:ring-4
                focus:ring-cyan-100
              "
            />

          </div>

          {/* สิทธิ์การใช้งาน */}

          <div>

            <label
              className="
                mb-2
                block
                text-lg
                font-extrabold
                text-white
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
                font-bold
                text-black
                outline-none
                transition
                focus:border-cyan-400
                focus:ring-4
                focus:ring-cyan-100
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

          {/* ปุ่ม */}

          <div className="pt-4">

            <button
              type="submit"
              className="
                rounded-xl
                bg-gradient-to-r
                from-emerald-600
                to-green-500
                px-6
                py-3
                text-base
                font-extrabold
                text-white
                shadow-lg
                transition
                hover:scale-105
                sm:px-8
                sm:text-lg
              "
            >
              💾 บันทึก
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}