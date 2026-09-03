import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

async function updateUser(formData: FormData) {
  "use server";

  await requireRole("ADMIN");

  const id = Number(formData.get("id"));

  const username = formData.get("username") as string;
  const fullname = formData.get("fullname") as string;
  const role = formData.get("role") as
    | "ADMIN"
    | "STAFF"
    | "VIEWER";
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
          rounded-2xl
          border
          border-slate-700
          bg-gradient-to-br
          from-slate-950
          via-slate-900
          to-slate-800
          p-8
          text-xl
          font-bold
          text-white
          shadow-xl
        "
      >
        ไม่พบผู้ใช้งาน
      </div>
    );
  }

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
            👤 แก้ไขผู้ใช้งานระบบ
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
            แก้ไขข้อมูลบัญชี สิทธิ์ และสถานะการใช้งาน
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
            action={updateUser}
            className="
              w-full
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
            <input
              type="hidden"
              name="id"
              value={user.id}
            />

            {/* Username / ชื่อ-นามสกุล */}

            <div
              className="
                grid
                gap-5
                md:grid-cols-2
              "
            >
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
                  defaultValue={user.username}
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
                  defaultValue={user.fullname}
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
                Password ใหม่
              </label>

              <input
                type="password"
                name="password"
                placeholder="เว้นว่างไว้ถ้าไม่เปลี่ยนรหัสผ่าน"
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
                  placeholder:text-slate-400
                  outline-none
                  transition
                  focus:border-cyan-400
                  focus:ring-4
                  focus:ring-cyan-900/40
                "
              />
            </div>

            {/* สิทธิ์ / สถานะ */}

            <div
              className="
                grid
                gap-5
                md:grid-cols-2
              "
            >
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
                  defaultValue={user.role}
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
                    text-lg
                    font-extrabold
                    text-white
                  "
                >
                  สถานะ
                </label>

                <select
                  name="active"
                  defaultValue={String(user.active)}
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
                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>
                </select>
              </div>
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
                💾 บันทึกการแก้ไข
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}