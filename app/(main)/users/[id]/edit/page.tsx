import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import AppPage from "@/components/AppPage";
import AppPageHeader from "@/components/AppPageHeader";
import AppButton from "@/components/AppButton";
import AppCard from "@/components/AppCard";
import AppInfoCard from "@/components/AppInfoCard";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type UserRole =
  | "ADMIN"
  | "STAFF"
  | "VIEWER";

/* =========================================================
   UPDATE USER
========================================================= */

async function updateUser(
  formData: FormData
) {
  "use server";

  await requireRole("ADMIN");

  /* =======================================================
     FORM VALUES
  ======================================================= */

  const id = Number(
    formData.get("id")
  );

  const username =
    String(
      formData.get("username") ?? ""
    ).trim();

  const fullname =
    String(
      formData.get("fullname") ?? ""
    ).trim();

  const role =
    String(
      formData.get("role") ?? ""
    ) as UserRole;

  const active =
    formData.get("active") ===
    "true";

  const password =
    String(
      formData.get("password") ?? ""
    );

  /* =======================================================
     VALIDATION
  ======================================================= */

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error(
      "รหัสผู้ใช้งานไม่ถูกต้อง"
    );
  }

  if (!username) {
    throw new Error(
      "กรุณาระบุ Username"
    );
  }

  if (!fullname) {
    throw new Error(
      "กรุณาระบุชื่อ-นามสกุล"
    );
  }

  if (
    ![
      "ADMIN",
      "STAFF",
      "VIEWER",
    ].includes(role)
  ) {
    throw new Error(
      "สิทธิ์การใช้งานไม่ถูกต้อง"
    );
  }

  /* =======================================================
     CHECK USERNAME
  ======================================================= */

  const existingUser =
    await prisma.user.findFirst({
      where: {
        username,

        NOT: {
          id,
        },
      },

      select: {
        id: true,
      },
    });

  if (existingUser) {
    throw new Error(
      "Username นี้ถูกใช้งานแล้ว"
    );
  }

  /* =======================================================
     UPDATE DATA
  ======================================================= */

  const data: {
    username: string;
    fullname: string;
    role: UserRole;
    active: boolean;
    password?: string;
  } = {
    username,
    fullname,
    role,
    active,
  };

  /* =======================================================
     PASSWORD

     เปลี่ยนเฉพาะเมื่อกรอกรหัสผ่านใหม่
  ======================================================= */

  if (password.trim() !== "") {
    data.password =
      await bcrypt.hash(
        password,
        10
      );
  }

  /* =======================================================
     DATABASE
  ======================================================= */

  await prisma.user.update({
    where: {
      id,
    },

    data,
  });

  /* =======================================================
     REDIRECT
  ======================================================= */

  redirect("/users");
}

/* =========================================================
   PAGE
========================================================= */

export default async function EditUserPage({
  params,
}: Props) {
  await requireRole("ADMIN");

  /* =======================================================
     PARAMS
  ======================================================= */

  const { id } =
    await params;

  const userId =
    Number(id);

  if (
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    redirect("/users");
  }

  /* =======================================================
     USER
  ======================================================= */

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  /* =======================================================
     NOT FOUND
  ======================================================= */

  if (!user) {
    return (
      <AppPage>
        <AppPageHeader
          icon="👤"
          title="ไม่พบผู้ใช้งาน"
          subtitle="ไม่พบข้อมูลบัญชีผู้ใช้งานที่ต้องการแก้ไข"
          actions={
            <AppButton
              href="/users"
              variant="back"
              size="md"
            >
              กลับ
            </AppButton>
          }
        />

        <AppCard>
          <div
            className="
              flex
              min-h-[220px]
              flex-col
              items-center
              justify-center
              px-4
              py-10
              text-center
            "
          >
            <div
              className="
                text-5xl
              "
              aria-hidden="true"
            >
              👤
            </div>

            <h2
              className="
                mt-4
                text-xl
                font-extrabold
                !text-slate-900
              "
            >
              ไม่พบผู้ใช้งาน
            </h2>

            <p
              className="
                mt-2
                text-sm
                font-semibold
                !text-slate-500
              "
            >
              บัญชีผู้ใช้งานนี้อาจถูกลบ
              หรือไม่มีอยู่ในระบบ
            </p>

            <div className="mt-6">
              <AppButton
                href="/users"
                variant="back"
                size="md"
              >
                กลับ
              </AppButton>
            </div>
          </div>
        </AppCard>
      </AppPage>
    );
  }

  /* =======================================================
     SHARED CLASSES
  ======================================================= */

  const labelClassName = `
    mb-2
    block

    text-sm
    font-extrabold
    !text-slate-700

    sm:text-base
  `;

  const inputClassName = `
    min-h-[50px]
    w-full

    rounded-[14px]

    border
    border-slate-300

    bg-white

    px-4
    py-3

    text-base
    font-bold
    !text-slate-900

    shadow-sm
    outline-none

    transition-all
    duration-200

    placeholder:!text-slate-400

    hover:border-slate-400
    hover:bg-slate-50

    focus:border-blue-400
    focus:bg-white
    focus:ring-4
    focus:ring-blue-500/10
  `;

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
        title="แก้ไขผู้ใช้งานระบบ"
        subtitle="แก้ไขข้อมูลบัญชี สิทธิ์ และสถานะการใช้งาน"
        actions={
          <AppButton
            href="/users"
            variant="back"
            size="md"
          >
            กลับ
          </AppButton>
        }
      />

      {/* =====================================================
          FORM
      ===================================================== */}

      <form
        action={updateUser}
        className="
          w-full
          min-w-0
        "
      >
        <input
          type="hidden"
          name="id"
          value={user.id}
        />

        <AppCard>
          {/* =================================================
              CARD HEADER
          ================================================= */}

          <div
            className="
              mb-6
              flex
              flex-col
              gap-2

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-lg
                  font-extrabold
                  !text-slate-900
                "
              >
                ข้อมูลผู้ใช้งาน
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  !text-slate-500
                "
              >
                แก้ไขข้อมูลบัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ
              </p>
            </div>

            {/* ===============================================
                CURRENT STATUS
            =============================================== */}

            <span
              className={`
                inline-flex
                w-fit
                items-center
                justify-center

                whitespace-nowrap

                rounded-full

                px-3
                py-1.5

                text-sm
                font-extrabold

                ${
                  user.active
                    ? `
                      bg-emerald-100
                      !text-emerald-800
                    `
                    : `
                      bg-slate-200
                      !text-slate-700
                    `
                }
              `}
            >
              {user.active
                ? "Active"
                : "Inactive"}
            </span>
          </div>

          {/* =================================================
              GRID
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-4

              lg:grid-cols-2
            "
          >
            {/* =============================================
                USERNAME
            ============================================= */}

            <AppInfoCard>
              <label
                htmlFor="username"
                className={
                  labelClassName
                }
              >
                Username{" "}
                <span className="!text-red-500">
                  *
                </span>
              </label>

              <input
                id="username"
                type="text"
                name="username"
                defaultValue={
                  user.username
                }
                required
                autoComplete="username"
                placeholder="ระบุ Username"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* =============================================
                FULL NAME
            ============================================= */}

            <AppInfoCard>
              <label
                htmlFor="fullname"
                className={
                  labelClassName
                }
              >
                ชื่อ-นามสกุล{" "}
                <span className="!text-red-500">
                  *
                </span>
              </label>

              <input
                id="fullname"
                type="text"
                name="fullname"
                defaultValue={
                  user.fullname
                }
                required
                autoComplete="name"
                placeholder="ระบุชื่อ-นามสกุล"
                className={
                  inputClassName
                }
              />
            </AppInfoCard>

            {/* =============================================
                PASSWORD
            ============================================= */}

            <div
              className="
                lg:col-span-2
              "
            >
              <AppInfoCard>
                <label
                  htmlFor="password"
                  className={
                    labelClassName
                  }
                >
                  Password ใหม่
                </label>

                <input
                  id="password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยนรหัสผ่าน"
                  className={
                    inputClassName
                  }
                />

                <p
                  className="
                    mt-2
                    text-xs
                    font-semibold
                    leading-relaxed
                    !text-slate-500
                  "
                >
                  หากไม่ต้องการเปลี่ยนรหัสผ่าน
                  ให้เว้นช่องนี้ว่างไว้
                </p>
              </AppInfoCard>
            </div>

            {/* =============================================
                ROLE
            ============================================= */}

            <AppInfoCard>
              <label
                htmlFor="role"
                className={
                  labelClassName
                }
              >
                สิทธิ์การใช้งาน
              </label>

              <select
                id="role"
                name="role"
                defaultValue={
                  user.role
                }
                className={
                  inputClassName
                }
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

              <p
                className="
                  mt-2
                  text-xs
                  font-semibold
                  leading-relaxed
                  !text-slate-500
                "
              >
                กำหนดระดับสิทธิ์ในการเข้าถึงและจัดการข้อมูลในระบบ
              </p>
            </AppInfoCard>

            {/* =============================================
                STATUS
            ============================================= */}

            <AppInfoCard>
              <label
                htmlFor="active"
                className={
                  labelClassName
                }
              >
                สถานะ
              </label>

              <select
                id="active"
                name="active"
                defaultValue={
                  String(
                    user.active
                  )
                }
                className={
                  inputClassName
                }
              >
                <option value="true">
                  Active
                </option>

                <option value="false">
                  Inactive
                </option>
              </select>

              <p
                className="
                  mt-2
                  text-xs
                  font-semibold
                  leading-relaxed
                  !text-slate-500
                "
              >
                กำหนดว่าบัญชีผู้ใช้งานสามารถเข้าใช้งานระบบได้หรือไม่
              </p>
            </AppInfoCard>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div
            className="
              mt-6

              flex
              flex-col-reverse
              gap-3

              border-t
              border-slate-200

              pt-5

              sm:flex-row
              sm:justify-end
            "
          >
            {/* ===============================================
                CANCEL

                ใช้ AppButton ตัวกลาง
            =============================================== */}

            <AppButton
              href="/users"
              variant="secondary"
              size="md"
            >
              ยกเลิก
            </AppButton>

            {/* ===============================================
                SAVE

                ใช้ AppButton ตัวกลาง
            =============================================== */}

            <AppButton
              type="submit"
              variant="success"
              size="md"
              icon={
                <span
                  aria-hidden="true"
                >
                  💾
                </span>
              }
            >
              บันทึกการแก้ไข
            </AppButton>
          </div>
        </AppCard>
      </form>
    </AppPage>
  );
}