import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

async function deleteUser(formData: FormData) {
  "use server";

  await requireRole("ADMIN");

  const id = Number(formData.get("id"));

  await prisma.user.delete({
    where: {
      id,
    },
  });

  redirect("/users");
}

const roleName: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  STAFF: "เจ้าหน้าที่",
  VIEWER: "ผู้ใช้งานทั่วไป",
};

export default async function UsersPage() {
  await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    orderBy: {
      id: "asc",
    },
  });

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
          flex-col
          justify-center
          gap-4
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
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:gap-4
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
              tracking-wide
              !text-white
              sm:text-5xl
            "
          >
            👤 ผู้ใช้งานระบบ
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
            จัดการบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ
          </p>
        </div>

        <Link
          href="/users/create"
          className="
            w-full
            shrink-0
            rounded-xl
            bg-gradient-to-r
            from-emerald-600
            to-green-500
            px-4
            py-2.5
            text-center
            text-sm
            font-extrabold
            !text-white
            shadow-lg
            transition
            hover:scale-105
            hover:shadow-xl
            sm:w-auto
            sm:px-6
            sm:py-3
            sm:text-lg
          "
        >
          + เพิ่มผู้ใช้งาน
        </Link>
      </div>

      {/* =====================================================
          Table
      ===================================================== */}

      <div
        className="
          w-full
          min-w-0
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-xl
        "
      >
        <div
          className="
            w-full
            min-w-0
            overflow-x-auto
            overscroll-x-contain
          "
        >
          <table
            className="
              min-w-full
              border-collapse
            "
          >
            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "Username",
                  "ชื่อ-นามสกุล",
                  "สิทธิ์",
                  "สถานะ",
                  "จัดการ",
                ].map((title) => (
                  <th
                    key={title}
                    className="
                      whitespace-nowrap
                      border
                      border-slate-900
                      bg-gradient-to-r
                      from-slate-800
                      to-slate-700
                      px-4
                      py-4
                      text-center
                      text-lg
                      font-extrabold
                      !text-white
                    "
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {users.length > 0 ? (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    className="
                      text-slate-900
                      transition
                      hover:bg-blue-50
                    "
                  >
                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-bold
                        text-slate-700
                      "
                    >
                      {index + 1}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                        font-bold
                        text-slate-800
                      "
                    >
                      {user.username}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        font-bold
                        text-slate-800
                      "
                    >
                      {user.fullname}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                      "
                    >
                      <span
                        className="
                          rounded-lg
                          bg-blue-100
                          px-3
                          py-1
                          font-bold
                          text-blue-700
                        "
                      >
                        {roleName[user.role] ?? user.role}
                      </span>
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                        text-center
                      "
                    >
                      {user.active ? (
                        <span
                          className="
                            rounded-lg
                            bg-emerald-100
                            px-3
                            py-1
                            font-bold
                            text-emerald-700
                          "
                        >
                          Active
                        </span>
                      ) : (
                        <span
                          className="
                            rounded-lg
                            bg-red-100
                            px-3
                            py-1
                            font-bold
                            text-red-700
                          "
                        >
                          Inactive
                        </span>
                      )}
                    </td>

                    <td
                      className="
                        border
                        border-slate-900
                        px-4
                        py-3
                      "
                    >
                      <div
                        className="
                          flex
                          justify-center
                          gap-2
                        "
                      >
                        <Link
                          href={`/users/${user.id}/edit`}
                          className="
                            rounded-lg
                            bg-slate-800
                            px-4
                            py-2
                            font-extrabold
                            text-white
                            shadow
                            transition
                            hover:bg-slate-700
                          "
                        >
                          แก้ไข
                        </Link>

                        <form action={deleteUser}>
                          <input
                            type="hidden"
                            name="id"
                            value={user.id}
                          />

                          <button
                            type="submit"
                            className="
                              rounded-lg
                              bg-red-600
                              px-4
                              py-2
                              font-extrabold
                              text-white
                              shadow
                              transition
                              hover:bg-red-700
                            "
                          >
                            ลบ
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="
                      border
                      border-slate-900
                      py-12
                      text-center
                      text-lg
                      font-bold
                      text-slate-500
                    "
                  >
                    ยังไม่มีผู้ใช้งาน
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}