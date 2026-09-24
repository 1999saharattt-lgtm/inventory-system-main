import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppTableCard from "@/components/AppTableCard";

export const dynamic = "force-dynamic";

/* =========================================================
   ROLE
========================================================= */

const roleName: Record<string, string> = {
  ADMIN: "ผู้ดูแลระบบ",
  STAFF: "เจ้าหน้าที่",
  VIEWER: "ผู้ใช้งานทั่วไป",
};

/* =========================================================
   DELETE USER
========================================================= */

async function deleteUser(
  formData: FormData
) {
  "use server";

  await requireRole("ADMIN");

  const id = Number(
    formData.get("id")
  );

  /* =======================================================
     VALIDATE ID
  ======================================================= */

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return;
  }

  /* =======================================================
     CHECK USER
  ======================================================= */

  const user =
    await prisma.user.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
      },
    });

  if (!user) {
    redirect("/users");
  }

  /* =======================================================
     DELETE
  ======================================================= */

  await prisma.user.delete({
    where: {
      id,
    },
  });

  redirect("/users");
}

/* =========================================================
   PAGE
========================================================= */

export default async function UsersPage() {
  /* =======================================================
     PERMISSION
  ======================================================= */

  await requireRole("ADMIN");

  /* =======================================================
     USERS
  ======================================================= */

  const users =
    await prisma.user.findMany({
      orderBy: {
        id: "asc",
      },
    });

  /* =========================================================
     UI
  ========================================================= */

  return (
    <AppPage>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppPageHeader
        icon="👤"
        title="ผู้ใช้งานระบบ"
        subtitle="จัดการบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ"
        actions={
          <AppButton
            href="/users/create"
            variant="primary"
            size="md"
            icon={
              <span aria-hidden="true">
                ＋
              </span>
            }
          >
            เพิ่มผู้ใช้งาน
          </AppButton>
        }
      />

      {/* =====================================================
          TABLE
      ===================================================== */}

      <AppTableCard
        title="รายการผู้ใช้งาน"
        subtitle="บัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ"
        badge={`${users.length.toLocaleString(
          "th-TH"
        )} รายการ`}
        className="
          w-full
          min-w-0
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
              w-full
              min-w-[900px]
              border-collapse
              bg-white
              text-base
            "
          >
            {/* =================================================
                TABLE HEADER
            ================================================= */}

            <thead>
              <tr>
                {[
                  "ลำดับ",
                  "Username",
                  "ชื่อ-นามสกุล",
                  "สิทธิ์",
                  "สถานะ",
                  "จัดการ",
                ].map(
                  (title) => (
                    <th
                      key={title}
                      className="
                        whitespace-nowrap
                        border
                        border-black

                        bg-gradient-to-r
                        from-slate-800
                        to-slate-700

                        px-4
                        py-4

                        text-center
                        text-base
                        font-extrabold
                        !text-white

                        sm:text-lg
                      "
                    >
                      {title}
                    </th>
                  )
                )}
              </tr>
            </thead>

            {/* =================================================
                TABLE BODY
            ================================================= */}

            <tbody>
              {users.length > 0 ? (
                users.map(
                  (
                    user,
                    index
                  ) => (
                    <tr
                      key={user.id}
                      className={`
                        ${
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                        }

                        transition-colors
                        duration-200

                        hover:bg-blue-50/70
                      `}
                    >
                      {/* =======================================
                          ORDER
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          text-base
                          font-bold
                          tabular-nums
                          !text-slate-900
                        "
                      >
                        {(
                          index + 1
                        ).toLocaleString(
                          "th-TH"
                        )}
                      </td>

                      {/* =======================================
                          USERNAME
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                          text-base
                          font-bold
                          !text-slate-900
                        "
                      >
                        {user.username}
                      </td>

                      {/* =======================================
                          FULLNAME
                      ======================================= */}

                      <td
                        className="
                          min-w-[220px]
                          border
                          border-black

                          px-4
                          py-3.5

                          text-base
                          font-bold
                          !text-slate-900
                        "
                      >
                        {user.fullname}
                      </td>

                      {/* =======================================
                          ROLE
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                        "
                      >
                        <span
                          className="
                            inline-flex
                            items-center
                            justify-center

                            whitespace-nowrap

                            rounded-full

                            bg-blue-100

                            px-3
                            py-1.5

                            text-base
                            font-extrabold
                            !text-blue-700
                          "
                        >
                          {roleName[
                            user.role
                          ] ?? user.role}
                        </span>
                      </td>

                      {/* =======================================
                          STATUS
                      ======================================= */}

                      <td
                        className="
                          whitespace-nowrap
                          border
                          border-black

                          px-4
                          py-3.5

                          text-center
                        "
                      >
                        {user.active ? (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-full

                              bg-emerald-100

                              px-3
                              py-1.5

                              text-base
                              font-extrabold
                              !text-emerald-700
                            "
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            className="
                              inline-flex
                              items-center
                              justify-center

                              whitespace-nowrap

                              rounded-full

                              bg-red-100

                              px-3
                              py-1.5

                              text-base
                              font-extrabold
                              !text-red-700
                            "
                          >
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* =======================================
                          ACTIONS
                      ======================================= */}

                      <td
                        className="
                          min-w-[230px]
                          whitespace-nowrap
                          border
                          border-black

                          px-4
                          py-3

                          text-center
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            justify-center
                            gap-2
                          "
                        >
                          {/* =================================
                              EDIT
                          ================================= */}

                          <AppButton
                            href={`/users/${user.id}/edit`}
                            variant="secondary"
                            size="sm"
                            icon={
                              <span
                                aria-hidden="true"
                              >
                                ✏️
                              </span>
                            }
                          >
                            แก้ไข
                          </AppButton>

                          {/* =================================
                              DELETE
                          ================================= */}

                          <form
                            action={
                              deleteUser
                            }
                          >
                            <input
                              type="hidden"
                              name="id"
                              value={
                                user.id
                              }
                            />

                            <AppButton
                              type="submit"
                              variant="danger"
                              size="sm"
                              icon={
                                <span
                                  aria-hidden="true"
                                >
                                  🗑️
                                </span>
                              }
                            >
                              ลบ
                            </AppButton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                )
              ) : (
                /* ===========================================
                    EMPTY STATE
                =========================================== */

                <tr>
                  <td
                    colSpan={6}
                    className="
                      border
                      border-black

                      bg-white

                      px-6
                      py-16

                      text-center
                    "
                  >
                    <div
                      className="
                        mx-auto
                        flex
                        max-w-md
                        flex-col
                        items-center
                        justify-center
                      "
                    >
                      <div
                        className="
                          grid
                          h-16
                          w-16
                          place-items-center
                          text-3xl
                        "
                        aria-hidden="true"
                      >
                        👤
                      </div>

                      <p
                        className="
                          mt-4

                          text-lg
                          font-extrabold
                          tracking-tight

                          !text-slate-900
                        "
                      >
                        ยังไม่มีผู้ใช้งาน
                      </p>

                      <p
                        className="
                          mt-1

                          text-sm
                          font-semibold
                          leading-relaxed

                          !text-slate-500
                        "
                      >
                        เมื่อมีการเพิ่มผู้ใช้งาน
                        ข้อมูลจะแสดงในตารางนี้
                      </p>

                      <div className="mt-5">
                        <AppButton
                          href="/users/create"
                          variant="primary"
                          size="md"
                          icon={
                            <span
                              aria-hidden="true"
                            >
                              ＋
                            </span>
                          }
                        >
                          เพิ่มผู้ใช้งาน
                        </AppButton>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AppTableCard>
    </AppPage>
  );
}