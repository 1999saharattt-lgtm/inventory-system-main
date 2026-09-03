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
    <div
      className="
        w-full
        min-w-0
        space-y-4
        overflow-x-hidden
        sm:space-y-6
      "
    >
      {/* =====================================================
          Header
      ===================================================== */}

      <div
        className="
          flex
          min-h-[110px]
          w-full
          min-w-0
          items-center
          justify-between
          gap-3
          rounded-2xl
          bg-gradient-to-r
          from-slate-950
          via-slate-800
          to-slate-700
          px-3
          py-4
          text-white
          shadow-xl
          sm:min-h-[140px]
          sm:px-8
          sm:py-6
        "
      >
        <div className="min-w-0">
          <h1
            className="
              break-words
              text-2xl
              font-extrabold
              leading-tight
              !text-white
              sm:text-3xl
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
              sm:text-base
            "
          >
            สร้างบัญชีผู้ใช้งานและกำหนดสิทธิ์การเข้าใช้งานระบบ
          </p>
        </div>

        <Link
          href="/users"
          className="
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-3
            py-2
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:shadow-xl
            sm:px-5
            sm:py-3
            sm:text-lg
          "
        >
          ← กลับ
        </Link>
      </div>

      {/* =====================================================
          Form
      ===================================================== */}

      <div className="flex w-full justify-center py-2 sm:py-4">
        <div className="w-full max-w-4xl">
          <form
            action={createUser}
            className="
              space-y-6
              rounded-3xl
              border
              border-slate-700
              bg-gradient-to-br
              from-slate-950
              via-slate-900
              to-slate-800
              p-6
              text-white
              shadow-2xl
              sm:p-8
            "
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
                  border-slate-600
                  bg-slate-800
                  p-3
                  text-lg
                  font-bold
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-cyan-400
                  focus:ring-4
                  focus:ring-cyan-900/40
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
                  border-slate-600
                  bg-slate-800
                  p-3
                  text-lg
                  font-bold
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-cyan-400
                  focus:ring-4
                  focus:ring-cyan-900/40
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
                  border-slate-600
                  bg-slate-800
                  p-3
                  text-lg
                  font-bold
                  text-white
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-cyan-400
                  focus:ring-4
                  focus:ring-cyan-900/40
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
                defaultValue="STAFF"
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-600
                  bg-slate-800
                  p-3
                  text-lg
                  font-bold
                  text-white
                  outline-none
                  transition
                  focus:border-cyan-400
                  focus:ring-4
                  focus:ring-cyan-900/40
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

            <div
              className="
                flex
                flex-col-reverse
                gap-3
                border-t
                border-slate-700
                pt-5
                sm:flex-row
                sm:justify-end
              "
            >
              <Link
                href="/users"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-700
                  px-6
                  py-3
                  text-base
                  font-extrabold
                  !text-white
                  shadow-lg
                  transition
                  hover:bg-slate-800
                  sm:px-8
                  sm:text-lg
                "
              >
                ยกเลิก
              </Link>

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
                  !text-white
                  shadow-lg
                  transition
                  hover:scale-105
                  hover:from-emerald-700
                  hover:to-green-600
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
    </div>
  );
}